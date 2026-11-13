"""HTTP API and local preview for the handbook."""

from collections import deque
from hmac import compare_digest
from time import monotonic

from aiohttp import web

from .assistant import Assistant, Question
from .config import Settings
from .corpus import Corpus
from .llm import LLMError, OpenRouterClient

ERRORS = {
    "timeout": (504, "Модель не успела ответить. Попробуйте ещё раз."),
    "rate_limit": (429, "Провайдер ограничил запросы. Попробуйте позже."),
    "provider_configuration": (502, "Провайдер отклонил запрос. Проверьте настройки модели."),
    "empty_response": (502, "Модель вернула пустой ответ. Переформулируйте вопрос."),
}


def error_response(status: int, message: str) -> web.Response:
    return web.json_response({"error": message}, status=status)


def create_app(
    settings: Settings, corpus: Corpus, model: OpenRouterClient | None = None,
) -> web.Application:
    model = model or OpenRouterClient(settings.model)
    assistant = Assistant(corpus, model)
    starts: deque[float] = deque()
    active = 0

    @web.middleware
    async def api_headers(request, handler):
        if not request.path.startswith("/api/ai/"):
            return await handler(request)
        origin = request.headers.get("Origin", "")
        # Accept a configured public origin and the same-origin loopback preview.
        local = (
            request.url.host in {"127.0.0.1", "localhost", "::1"}
            and origin == f"{request.scheme}://{request.host}"
        )
        if origin and origin != settings.allowed_origin and not local:
            return error_response(403, "Этот сайт не подключён к помощнику.")
        if request.method == "OPTIONS":
            response = web.Response(status=204)
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        else:
            try:
                response = await handler(request)
            except web.HTTPRequestEntityTooLarge:
                response = error_response(413, "Запрос слишком длинный.")
        response.headers["Cache-Control"] = "no-store"
        response.headers["Vary"] = "Origin"
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
        return response

    async def status(_request: web.Request) -> web.Response:
        return web.json_response({
            "ready": True,
            "requires_token": bool(settings.access_token),
        })

    async def ask(request: web.Request) -> web.Response:
        nonlocal active
        if settings.access_token:
            expected = f"Bearer {settings.access_token}".encode()
            supplied = request.headers.get("Authorization", "").encode()
            if not compare_digest(supplied, expected):
                return error_response(401, "Введите действующий код доступа.")
        if request.content_type != "application/json":
            return error_response(415, "Запрос должен быть в формате JSON.")
        try:
            payload = await request.json()
        except (UnicodeError, ValueError):
            return error_response(400, "Не удалось прочитать запрос.")
        try:
            question = Question.parse(payload, corpus.chapters)
        except ValueError as error:
            return error_response(400, str(error))
        now = monotonic()
        while starts and now - starts[0] >= 60:
            starts.popleft()
        if len(starts) >= 18 or active >= 3:
            return error_response(429, "Помощник занят. Попробуйте через минуту.")
        active += 1
        starts.append(now)
        try:
            return web.json_response(await assistant.answer(question))
        except LLMError as error:
            status_code, message = ERRORS.get(
                error.kind, (502, "Сервис модели временно недоступен. Попробуйте позже."),
            )
            return error_response(status_code, message)
        finally:
            active -= 1

    async def close_model(_app: web.Application) -> None:
        await model.close()

    async def index(_request: web.Request) -> web.FileResponse:
        return web.FileResponse(settings.docs / "index.html")

    app = web.Application(middlewares=[api_headers], client_max_size=64 * 1024)
    app.on_cleanup.append(close_model)
    app.router.add_get("/api/ai/status", status)
    app.router.add_post("/api/ai/ask", ask)
    app.router.add_route("OPTIONS", "/api/ai/{operation:status|ask}", status)
    if (settings.docs / "index.html").is_file():
        app.router.add_get("/", index)
        app.router.add_static("/", settings.docs, show_index=False)
    return app
