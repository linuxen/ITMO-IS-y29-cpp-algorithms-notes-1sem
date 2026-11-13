from pathlib import Path
from unittest import IsolatedAsyncioTestCase

from aiohttp.test_utils import TestClient, TestServer

from notes_ai.config import ModelSettings, Settings
from notes_ai.corpus import Corpus
from notes_ai.llm import LLMReply
from notes_ai.server import create_app

ROOT = Path(__file__).resolve().parents[2]


class FakeModel:
    async def complete(self, messages):
        self.messages = messages
        return LLMReply("Обход по слоям [1, 99]. Индекс `a[99]`.", False)

    async def close(self):
        pass


class AssistantTests(IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.corpus = Corpus.from_directory(ROOT / "content")
        self.model = FakeModel()
        settings = Settings(
            ModelSettings("test"), ROOT / "docs",
            allowed_origin="https://linuxen.github.io",
        )
        self.client = TestClient(TestServer(create_app(settings, self.corpus, self.model)))
        await self.client.start_server()
        self.addAsyncCleanup(self.client.close)

    async def test_question_returns_chapter_sources(self):
        async with self.client.post("/api/ai/ask", json={
            "question": "Почему BFS находит кратчайший путь?",
            "chapter": "traversal",
        }) as response:
            self.assertEqual(response.status, 200)
            result = await response.json()
        self.assertEqual(result["answer"], "Обход по слоям [1]. Индекс `a[99]`.")
        source = result["sources"][0]
        page, _, anchor = source["url"].partition("#")
        self.assertEqual(page, "traversal.html")
        self.assertIn(f'id="{anchor}"', (ROOT / "docs" / page).read_text(encoding="utf-8"))
        self.assertIn("BFS", source["title"])
        self.assertIn("BFS", self.model.messages[-1]["content"])

    async def test_wrong_origin_and_unknown_chapter(self):
        async with self.client.post(
            "/api/ai/ask",
            headers={"Origin": "https://example.invalid"},
            json={"question": "Что такое BFS?"},
        ) as response:
            self.assertEqual(response.status, 403)
        async with self.client.post("/api/ai/ask", json={
            "question": "Что такое BFS?", "chapter": "../unknown",
        }) as response:
            self.assertEqual(response.status, 400)

    async def test_configured_public_origin(self):
        async with self.client.options(
            "/api/ai/ask", headers={"Origin": "https://linuxen.github.io"},
        ) as response:
            self.assertEqual(response.status, 204)
            self.assertEqual(
                response.headers["Access-Control-Allow-Origin"], "https://linuxen.github.io",
            )
