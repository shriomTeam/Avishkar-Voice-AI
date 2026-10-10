from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.responses import JSONResponse

from app.api.router import router
from app.core.config import Settings
from app.core.logging import audit
from app.db import models  # noqa: F401
from app.db.session import create_database
from app.modules.auth.google import GoogleProvider


def create_app(settings: Settings | None = None, google=None) -> FastAPI:
    settings = settings or Settings()
    engine, factory = create_database(settings)

    @asynccontextmanager
    async def lifespan(app):
        yield
        await engine.dispose()

    app = FastAPI(
        title="Avishkar API",
        lifespan=lifespan,
        docs_url=None if settings.app_env == "production" else "/docs",
        redoc_url=None,
        openapi_url=None if settings.app_env == "production" else "/openapi.json",
    )
    app.state.settings = settings
    app.state.engine = engine
    app.state.session_factory = factory
    app.state.google = google or GoogleProvider(settings)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)
    app.include_router(router)

    @app.middleware("http")
    async def response_policy(request: Request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    @app.exception_handler(SQLAlchemyError)
    async def database_error(request, exc):
        audit("database_unavailable")
        return JSONResponse({"detail": "service_unavailable"}, status_code=503)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request, exc):
        # Do not reflect supplied tokens/input in public error bodies.
        return JSONResponse({"detail": "invalid_request"}, status_code=422)

    return app
