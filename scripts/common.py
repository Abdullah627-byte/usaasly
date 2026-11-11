"""Shared helpers for the Usassly data scripts (stdlib only)."""
from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
TOOLS_PATH = ROOT / "src" / "data" / "tools.json"
LOG_DIR = ROOT / "logs"


def load_env(path: Path = ROOT / ".env") -> None:
    """Minimal .env loader. Real environment variables always win."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def load_tools(path: Path = TOOLS_PATH) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON array of tools")
    return data


def save_tools(tools: list[dict[str, Any]], path: Path = TOOLS_PATH) -> None:
    """Atomic write so a crash mid-save can never corrupt tools.json."""
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".tools-", suffix=".json")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(tools, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise
