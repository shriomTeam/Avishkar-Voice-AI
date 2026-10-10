import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User
from app.modules.workspaces.models import Membership, Workspace
from app.modules.workspaces.repository import memberships
from app.modules.workspaces.schemas import WorkspaceCreate


async def create_workspace(db: AsyncSession, user_id: uuid.UUID, data: WorkspaceCreate):
    # Lock user to serialize two onboarding submissions and recheck disabled status.
    user = (await db.execute(select(User).where(User.id == user_id).with_for_update())).scalar_one()
    if not user.active:
        raise HTTPException(401, detail="not_authenticated")
    existing = await memberships(db, user_id)
    if existing:
        return existing[0][1]
    # A removed membership is not permission to create another workspace in this release.
    previous = (
        await db.execute(
            select(Membership.id).where(
                Membership.user_id == user_id,
            )
        )
    ).first()
    if previous:
        raise HTTPException(403, detail="workspace_access_denied")
    workspace = Workspace(id=uuid.uuid4(), **data.model_dump())
    db.add(workspace)
    await db.flush()
    db.add(Membership(user_id=user_id, workspace_id=workspace.id, role="owner"))
    await db.commit()
    return workspace
