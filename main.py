"""Vercel FastAPI entrypoint.

Vercel's Python/FastAPI auto-detection looks for an `app` variable in default
root-level locations. The actual backend application lives under
`backend/src/cafe_pickup_hub`, so this shim exposes it without changing the
local backend development layout.
"""

from pathlib import Path
import sys

_BACKEND_SRC = Path(__file__).resolve().parent / "backend" / "src"
if str(_BACKEND_SRC) not in sys.path:
    sys.path.insert(0, str(_BACKEND_SRC))

from cafe_pickup_hub.main import app  # type: ignore[import-not-found]  # noqa: E402
