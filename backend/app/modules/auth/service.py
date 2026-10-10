from datetime import timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import csrf_token, digest, now, random_token
from app.modules.auth.models import AuthSession, OAuthTransaction
from app.modules.auth.repository import clean_expired, revoke
from app.modules.users.repository import upsert_google_user


async def start_login(db: AsyncSession, settings: Settings):
    state, nonce, verifier, binding = (random_token() for _ in range(4))
    await clean_expired(db)
    db.add(
        OAuthTransaction(
            state_hash=digest(state),
            binding_hash=digest(binding),
            nonce=nonce,
            verifier=verifier,
            expires_at=now() + timedelta(seconds=settings.oauth_transaction_ttl_seconds),
        )
    )
    await db.commit()
    return state, nonce, verifier, binding


async def create_session(db: AsyncSession, claims: dict, settings: Settings, old_token: str):
    user = await upsert_google_user(db, claims)
    if old_token:
        await revoke(db, old_token)
    raw = random_token()
    db.add(
        AuthSession(
            user_id=user.id,
            token_hash=digest(raw),
            csrf_token_hash=digest(csrf_token(raw)),
            expires_at=now() + timedelta(seconds=settings.session_ttl_seconds),
        )
    )
    await db.commit()
    return user, raw
