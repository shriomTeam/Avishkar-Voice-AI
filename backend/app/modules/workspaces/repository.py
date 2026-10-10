import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.workspaces.models import Membership, Workspace


async def memberships(db: AsyncSession, user_id: uuid.UUID):
    return (
        await db.execute(
            select(Membership, Workspace)
            .join(
                Workspace,
                Membership.workspace_id == Workspace.id,
            )
            .where(Membership.user_id == user_id, Membership.active.is_(True))
            .order_by(Membership.created_at, Membership.id)
        )
    ).all()
