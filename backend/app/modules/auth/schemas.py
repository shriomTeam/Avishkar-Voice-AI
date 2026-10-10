import uuid

from pydantic import BaseModel

from app.modules.users.schemas import UserOut
from app.modules.workspaces.schemas import WorkspaceOut


class MembershipOut(BaseModel):
    workspace_id: uuid.UUID
    role: str
    workspace: WorkspaceOut


class MeOut(BaseModel):
    user: UserOut
    memberships: list[MembershipOut]
    workspace: WorkspaceOut | None
    needs_onboarding: bool
    csrf_token: str
