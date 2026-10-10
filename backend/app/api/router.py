from fastapi import APIRouter, Request
from sqlalchemy import text
from starlette.responses import JSONResponse

from app.api.dependencies import DB
from app.modules.auth.router import router as auth_router
from app.modules.workspaces.router import router as workspace_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router)
router.include_router(workspace_router)


@router.get("/health/live")
async def live():
    return {"status": "ok"}


@router.get("/health/ready")
async def ready(request: Request, db: DB):
    try:
        await db.execute(text("SELECT 1 FROM users LIMIT 1"))
        return {
            "status": "ready",
            "google_configured": request.app.state.settings.google_configured,
        }
    except Exception:
        return JSONResponse({"status": "unavailable"}, status_code=503)
