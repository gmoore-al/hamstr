"""FastAPI application entrypoint for the Hamstr rehoming marketplace."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .database import engine
from .routers import hamsters

settings = get_settings()

app = FastAPI(
    title="Hamstr API",
    version="0.1.0",
    description="A gentle marketplace for rehoming hamsters with care.",
)

_cors_kwargs: dict[str, object] = {
    "allow_origins": settings.cors_origins_list,
    "allow_credentials": False,
    "allow_methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "allow_headers": ["*"],
}
if settings.cors_allow_origin_regex and settings.cors_allow_origin_regex.strip():
    _cors_kwargs["allow_origin_regex"] = settings.cors_allow_origin_regex.strip()

app.add_middleware(CORSMiddleware, **_cors_kwargs)

app.include_router(hamsters.router)


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    """Liveness probe used by deployment targets and smoke tests."""
    return {"status": "ok"}


@app.get("/health/db", tags=["meta"])
def health_db() -> JSONResponse | dict[str, object]:
    """Smoke test Postgres (Supabase): TCP + optional ``hamsters`` table."""
    from sqlalchemy import text

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            has_hamsters = conn.execute(
                text(
                    "SELECT EXISTS (SELECT FROM information_schema.tables "
                    "WHERE table_schema = 'public' AND table_name = 'hamsters')"
                )
            ).scalar()
        out: dict[str, object] = {
            "database": "connected",
            "hamsters_table": bool(has_hamsters),
        }
        if not has_hamsters:
            out["hint"] = "Run `alembic upgrade head` (and `python scripts/seed.py`) against this DATABASE_URL."
        return out
    except Exception as e:  # noqa: BLE001 — diagnostic endpoint
        return JSONResponse(
            status_code=503,
            content={
                "database": "error",
                "kind": type(e).__name__,
                "message": str(e)[:400],
            },
        )
