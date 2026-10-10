import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.security import now
from app.db.base import Base, Record


class Workspace(Record, Base):
    __tablename__ = "workspaces"
    name: Mapped[str] = mapped_column(String(80))
    timezone: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str | None] = mapped_column(String(16), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class Membership(Record, Base):
    __tablename__ = "workspace_memberships"
    __table_args__ = (UniqueConstraint("user_id", "workspace_id"),)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(20), default="owner")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
