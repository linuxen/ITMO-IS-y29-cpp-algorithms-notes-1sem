"""Run the study assistant."""

import argparse
from pathlib import Path

from aiohttp import web

from .config import ROOT, load_settings
from .corpus import Corpus
from .server import create_app


def main():
    parser = argparse.ArgumentParser(description="Помощник по C++ и алгоритмам")
    parser.add_argument("--env-file", type=Path, default=ROOT / "ai-assistant" / ".env")
    parser.add_argument("--content", type=Path, default=ROOT / "content")
    parser.add_argument("--docs", type=Path, default=ROOT / "docs")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8766)
    args = parser.parse_args()
    try:
        settings = load_settings(args.env_file, args.docs)
        corpus = Corpus.from_directory(args.content)
    except (OSError, ValueError) as error:
        parser.exit(2, f"{error}\n")
    web.run_app(create_app(settings, corpus), host=args.host, port=args.port, access_log=None)


if __name__ == "__main__":
    main()
