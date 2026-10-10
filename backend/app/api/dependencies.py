from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import check_csrf
from app.db.session import get_db
from app.modules.auth.models import AuthSession
from app.modules.auth.repository import session_user
from app.modules.users.models import User
from app.modules.workspaces.models import Membership

DB = Annotated[AsyncSession, Depends(get_db)]


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


@dataclass
class Principal:
    session: AuthSession
    user: User
    raw_token: str


async def get_current_session(request: Request, db: DB) -> Principal:
    settings = get_settings(request)
    token = request.cookies.get(settings.session_cookie_name, "")
    result = await session_user(db, token) if token and len(token) <= 128 else None
    if not result:
        raise HTTPException(401, detail="not_authenticated")
    return Principal(result[0], result[1], token)


CurrentSession = Annotated[Principal, Depends(get_current_session)]


async def get_current_user(principal: CurrentSession) -> User:
    return principal.user


async def require_csrf(request: Request, principal: CurrentSession) -> Principal:
    check_csrf(request, principal.session.csrf_token_hash, get_settings(request))
    return principal


ProtectedWrite = Annotated[Principal, Depends(require_csrf)]


async def require_workspace_member(workspace_id: UUID, principal: CurrentSession, db: DB):
    member = (
        await db.execute(
            select(Membership).where(
                Membership.workspace_id == workspace_id,
                Membership.user_id == principal.user.id,
                Membership.active.is_(True),
            )
        )
    ).scalar_one_or_none()
    if not member:
        raise HTTPException(403, detail="workspace_access_denied")
    return member


def require_workspace_role(*roles: str):
    async def dependency(member: Annotated[Membership, Depends(require_workspace_member)]):
        if member.role not in roles:
            raise HTTPException(403, detail="workspace_role_denied")
        return member

    return dependency
