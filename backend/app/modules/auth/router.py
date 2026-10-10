from fastapi import APIRouter, HTTPException, Request, Response
from starlette.responses import RedirectResponse

from app.api.dependencies import DB, CurrentSession, ProtectedWrite, get_settings
from app.core.logging import audit
from app.core.security import clear_cookie, csrf_token, set_cookie
from app.modules.auth.repository import claim_transaction, limit, revoke
from app.modules.auth.schemas import MembershipOut, MeOut
from app.modules.auth.service import create_session, start_login
from app.modules.users.schemas import UserOut
from app.modules.workspaces.repository import memberships
from app.modules.workspaces.schemas import WorkspaceOut

router = APIRouter(prefix="/auth", tags=["auth"])


def login_error(request: Request, code: str):
    settings = get_settings(request)
    response = RedirectResponse(
        settings.public_app_origin + "/login?error=" + code, status_code=303
    )
    clear_cookie(response, settings.binding_cookie_name, settings)
    response.headers["Cache-Control"] = "no-store"
    audit("login_" + code)
    return response


@router.get("/google/login")
async def google_login(request: Request, db: DB):
    settings = get_settings(request)
    if not settings.google_configured:
        return login_error(request, "not_configured")
    await limit(db, "login:" + (request.client.host if request.client else "unknown"), 20)
    try:
        state, nonce, verifier, binding = await start_login(db, settings)
        url = await request.app.state.google.authorization_url(state, nonce, verifier)
    except Exception:
        await db.rollback()
        return login_error(request, "unavailable")
    response = RedirectResponse(url, status_code=302)
    set_cookie(
        response,
        settings.binding_cookie_name,
        binding,
        settings.oauth_transaction_ttl_seconds,
        settings,
    )
    response.headers["Cache-Control"] = "no-store"
    return response


@router.get("/google/callback")
async def google_callback(request: Request, db: DB):
    settings = get_settings(request)
    if not settings.google_configured:
        return login_error(request, "not_configured")
    await limit(db, "callback:" + (request.client.host if request.client else "unknown"), 40)
    state = request.query_params.get("state", "")
    binding = request.cookies.get(settings.binding_cookie_name, "")
    if not state or not binding or len(state) > 128 or len(binding) > 128:
        return login_error(request, "invalid_login")
    try:
        transaction = await claim_transaction(db, state, binding)
        if not transaction:
            return login_error(request, "invalid_login")
        if request.query_params.get("error"):
            return login_error(request, "cancelled")
        code = request.query_params.get("code", "")
        if not code or len(code) > 4096:
            return login_error(request, "invalid_login")
        claims = await request.app.state.google.identity(
            code, transaction.nonce, transaction.verifier
        )
        user, raw = await create_session(
            db,
            claims,
            settings,
            request.cookies.get(settings.session_cookie_name, ""),
        )
        rows = await memberships(db, user.id)
    except HTTPException as exc:
        await db.rollback()
        return login_error(
            request, "account_disabled" if exc.status_code == 403 else "invalid_login"
        )
    except Exception:
        await db.rollback()
        return login_error(request, "failed")
    response = RedirectResponse(
        settings.public_app_origin + ("/dashboard" if rows else "/onboarding"), status_code=303
    )
    set_cookie(response, settings.session_cookie_name, raw, settings.session_ttl_seconds, settings)
    clear_cookie(response, settings.binding_cookie_name, settings)
    response.headers["Cache-Control"] = "no-store"
    audit("login_success")
    return response


@router.get("/me", response_model=MeOut)
async def me(response: Response, principal: CurrentSession, db: DB):
    rows = await memberships(db, principal.user.id)
    response.headers["Cache-Control"] = "no-store"
    entries = [
        MembershipOut(
            workspace_id=m.workspace_id, role=m.role, workspace=WorkspaceOut.model_validate(w)
        )
        for m, w in rows
    ]
    return MeOut(
        user=UserOut.model_validate(principal.user),
        memberships=entries,
        workspace=entries[0].workspace if entries else None,
        needs_onboarding=not entries,
        csrf_token=csrf_token(principal.raw_token),
    )


@router.post("/logout", status_code=204)
async def logout(request: Request, principal: ProtectedWrite, db: DB):
    settings = get_settings(request)
    await revoke(db, principal.raw_token)
    await db.commit()
    response = Response(status_code=204, headers={"Cache-Control": "no-store"})
    clear_cookie(response, settings.session_cookie_name, settings)
    clear_cookie(response, settings.binding_cookie_name, settings)
    audit("logout")
    return response
