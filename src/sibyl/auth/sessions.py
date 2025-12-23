"""User session management."""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from sibyl.db.models import UserSession


class SessionManager:
    """Manages user sessions for tracking and revocation."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @staticmethod
    def hash_token(token: str) -> str:
        """Create SHA256 hash of a token for storage."""
        return hashlib.sha256(token.encode()).hexdigest()

    async def create_session(
        self,
        *,
        user_id: UUID,
        token: str,
        expires_at: datetime,
        organization_id: UUID | None = None,
        device_name: str | None = None,
        device_type: str | None = None,
        browser: str | None = None,
        os: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        location: str | None = None,
    ) -> UserSession:
        """Create a new user session."""
        token_hash = self.hash_token(token)

        session_record = UserSession(
            id=uuid4(),
            user_id=user_id,
            organization_id=organization_id,
            token_hash=token_hash,
            device_name=device_name,
            device_type=device_type,
            browser=browser,
            os=os,
            ip_address=ip_address,
            user_agent=user_agent,
            location=location,
            is_current=False,
            last_active_at=datetime.now(UTC).replace(tzinfo=None),
            expires_at=expires_at if expires_at.tzinfo is None else expires_at.replace(tzinfo=None),
        )
        self._session.add(session_record)
        await self._session.flush()
        return session_record

    async def get_session_by_token(self, token: str) -> UserSession | None:
        """Get a session by raw token."""
        token_hash = self.hash_token(token)
        result = await self._session.execute(
            select(UserSession)
            .where(UserSession.token_hash == token_hash)
            .where(UserSession.revoked_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def list_user_sessions(
        self,
        user_id: UUID,
        *,
        include_expired: bool = False,
    ) -> list[UserSession]:
        """List all sessions for a user."""
        query = (
            select(UserSession)
            .where(UserSession.user_id == user_id)
            .where(UserSession.revoked_at.is_(None))
            .order_by(UserSession.last_active_at.desc())
        )

        if not include_expired:
            now = datetime.now(UTC).replace(tzinfo=None)
            query = query.where(UserSession.expires_at > now)

        result = await self._session.execute(query)
        return list(result.scalars().all())

    async def update_activity(self, token: str) -> bool:
        """Update last_active_at for a session."""
        session = await self.get_session_by_token(token)
        if session is None:
            return False

        session.last_active_at = datetime.now(UTC).replace(tzinfo=None)
        return True

    async def mark_current(self, token: str) -> bool:
        """Mark a session as the current one for its user."""
        session = await self.get_session_by_token(token)
        if session is None:
            return False

        result = await self._session.execute(
            select(UserSession)
            .where(UserSession.user_id == session.user_id)
            .where(UserSession.is_current.is_(True))
        )
        for s in result.scalars():
            s.is_current = False

        session.is_current = True
        return True

    async def revoke_session(self, session_id: UUID, user_id: UUID) -> bool:
        """Revoke a specific session."""
        result = await self._session.execute(
            select(UserSession)
            .where(UserSession.id == session_id)
            .where(UserSession.user_id == user_id)
            .where(UserSession.revoked_at.is_(None))
        )
        session = result.scalar_one_or_none()

        if session is None:
            return False

        session.revoked_at = datetime.now(UTC).replace(tzinfo=None)
        await self._session.commit()
        return True

    async def revoke_all_sessions(
        self,
        user_id: UUID,
        *,
        exclude_token_hash: str | None = None,
    ) -> int:
        """Revoke all sessions for a user."""
        query = (
            select(UserSession)
            .where(UserSession.user_id == user_id)
            .where(UserSession.revoked_at.is_(None))
        )

        if exclude_token_hash:
            query = query.where(UserSession.token_hash != exclude_token_hash)

        result = await self._session.execute(query)
        sessions = result.scalars().all()

        now = datetime.now(UTC).replace(tzinfo=None)
        count = 0
        for session in sessions:
            session.revoked_at = now
            count += 1

        await self._session.commit()
        return count

    async def cleanup_expired(self, *, older_than_days: int = 30) -> int:
        """Delete expired sessions older than specified days."""
        from datetime import timedelta

        cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=older_than_days)

        result = await self._session.execute(
            select(UserSession).where(UserSession.expires_at < cutoff)
        )
        sessions = result.scalars().all()

        count = 0
        for session in sessions:
            await self._session.delete(session)
            count += 1

        await self._session.commit()
        return count
