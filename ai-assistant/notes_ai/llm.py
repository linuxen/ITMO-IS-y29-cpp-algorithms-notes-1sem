"""Text-only adaptation of the Telegram bot's OpenRouterClient."""

import asyncio
import re
from dataclasses import dataclass

import aiohttp
from aiohttp_socks import ProxyConnector

from .config import ModelSettings

RETRYABLE_STATUSES = {429, 500, 502, 503, 504}
THOUGHT_BLOCK = re.compile(r"<(thought|think)>.*?(?:</\1>|\Z)", re.DOTALL | re.I)


class LLMError(Exception):
    def __init__(self, kind: str):
        super().__init__(kind)
        self.kind = kind


@dataclass(frozen=True)
class LLMReply:
    text: str
    truncated: bool


class OpenRouterClient:
    def __init__(self, settings: ModelSettings, *, retries: int = 1):
        self.settings = settings
        self.retries = retries
        self._session: aiohttp.ClientSession | None = None

    async def close(self) -> None:
        if self._session is not None:
            await self._session.close()
            self._session = None

    def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            proxy = self.settings.llm_proxy_url
            connector = ProxyConnector.from_url(proxy) if proxy else None
            self._session = aiohttp.ClientSession(
                headers={"Authorization": f"Bearer {self.settings.llm_api_key}"},
                connector=connector,
                timeout=aiohttp.ClientTimeout(total=self.settings.llm_timeout),
            )
        return self._session

    async def complete(self, messages: list[dict[str, str]]) -> LLMReply:
        payload = {
            "model": self.settings.llm_model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": self.settings.llm_max_tokens,
        }
        url = self.settings.llm_base_url + "/chat/completions"
        for attempt in range(self.retries + 1):
            delay = 1.0
            kind = "unavailable"
            try:
                async with self._get_session().post(
                    url, json=payload, allow_redirects=False
                ) as response:
                    if response.status == 200:
                        return parse_reply(await response.json(content_type=None))
                    if response.status not in RETRYABLE_STATUSES:
                        raise LLMError("provider_configuration")
                    kind = "rate_limit" if response.status == 429 else "unavailable"
                    try:
                        delay = max(0.0, float(response.headers.get("Retry-After", "1")))
                    except ValueError:
                        pass
            except TimeoutError:
                raise LLMError("timeout") from None
            except (ValueError, UnicodeError):
                raise LLMError("invalid_response") from None
            except aiohttp.ClientError:
                pass
            if attempt == self.retries or delay > 5:
                raise LLMError(kind)
            await asyncio.sleep(delay)
        raise AssertionError("retry loop exhausted")


def parse_reply(payload: object) -> LLMReply:
    if isinstance(payload, dict) and "error" in payload:
        error = payload["error"]
        code = error.get("code") if isinstance(error, dict) else None
        raise LLMError("rate_limit" if str(code) == "429" else "unavailable")
    try:
        choice = payload["choices"][0]
        content = choice["message"]["content"]
        finish_reason = choice.get("finish_reason")
    except (AttributeError, KeyError, IndexError, TypeError):
        raise LLMError("invalid_response") from None
    if not isinstance(content, str):
        raise LLMError("invalid_response")
    text = THOUGHT_BLOCK.sub("", content).strip()
    if not text:
        raise LLMError("empty_response")
    return LLMReply(text[:9000], finish_reason == "length" or len(text) > 9000)
