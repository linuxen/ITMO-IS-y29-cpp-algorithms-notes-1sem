"""Server settings. Only the model settings are read from a shared env file."""

import os
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import dotenv_values

MODEL_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free"

ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class ModelSettings:
    llm_api_key: str = field(repr=False)
    llm_base_url: str = MODEL_URL
    llm_model: str = DEFAULT_MODEL
    llm_proxy_url: str = field(default="", repr=False)
    llm_timeout: float = 45
    llm_max_tokens: int = 1500


@dataclass(frozen=True)
class Settings:
    model: ModelSettings
    docs: Path
    allowed_origin: str = ""
    access_token: str = field(default="", repr=False)


def load_settings(env_file: Path, docs: Path) -> Settings:
    values = dotenv_values(env_file) if env_file.is_file() else {}

    def value(name: str, default: str = "") -> str:
        return (os.environ.get(name, values.get(name)) or default).strip()

    key = value("LLM_API_KEY")
    if not key:
        raise ValueError("Задайте LLM_API_KEY в окружении или передайте --env-file.")
    base = value("LLM_BASE_URL", MODEL_URL).rstrip("/")
    endpoint = urlsplit(base)
    if (endpoint.scheme != "https" or not endpoint.hostname or endpoint.username
            or endpoint.password or endpoint.query or endpoint.fragment):
        raise ValueError("LLM_BASE_URL должен быть HTTPS-адресом API.")
    try:
        timeout = float(value("LLM_TIMEOUT", "45"))
        max_tokens = int(value("LLM_MAX_TOKENS", "1500"))
    except ValueError:
        raise ValueError("LLM_TIMEOUT и LLM_MAX_TOKENS должны быть числами.") from None
    if not 2 <= timeout <= 90 or not 128 <= max_tokens <= 3000:
        raise ValueError("Допустимые LLM_TIMEOUT 2–90 и LLM_MAX_TOKENS 128–3000.")
    origin = value("AI_ALLOWED_ORIGIN").rstrip("/")
    if origin:
        parsed = urlsplit(origin)
        if (parsed.scheme != "https" or not parsed.hostname or parsed.path
                or parsed.query or parsed.fragment or parsed.username or parsed.password):
            raise ValueError("AI_ALLOWED_ORIGIN должен быть HTTPS-адресом сайта без пути.")
    return Settings(
        model=ModelSettings(
            llm_api_key=key,
            llm_base_url=base,
            llm_model=value("LLM_MODEL", DEFAULT_MODEL),
            llm_proxy_url=value("LLM_PROXY_URL"),
            llm_timeout=timeout,
            llm_max_tokens=max_tokens,
        ),
        docs=docs.resolve(),
        allowed_origin=origin,
        access_token=value("AI_ACCESS_TOKEN"),
    )
