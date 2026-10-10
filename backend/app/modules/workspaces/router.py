from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import DB, ProtectedWrite, require_workspace_member
from app.modules.auth.repository import limit
from app.modules.workspaces.models import Membership, Workspace
from app.modules.workspaces.schemas import WorkspaceCreate, WorkspaceOut
from app.modules.workspaces.service import create_workspace

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.post("", response_model=WorkspaceOut)
async def onboarding(data: WorkspaceCreate, principal: ProtectedWrite, db: DB):
    await limit(db, "workspace:" + str(principal.user.id), 10)
    return await create_workspace(db, principal.user.id, data)


@router.get("/{workspace_id}", response_model=WorkspaceOut)
async def detail(
    workspace_id: UUID, db: DB, member: Annotated[Membership, Depends(require_workspace_member)]
):
    workspace = await db.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(404, detail="workspace_not_found")
    return workspace
