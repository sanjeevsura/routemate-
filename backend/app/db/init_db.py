import os
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal

async def init_admin_accounts() -> None:
    """Ensure mandatory administrator accounts exist in the database with UserRole.ADMIN."""
    admin_emails = [
        "99240041036@klu.ac.in",
        "9924051001@klu.ac.in",
        "9924051001",
    ]
    
    # Fetch initial seed password from env if available, else default secure fallback
    admin_password = os.getenv("ADMIN_INITIAL_PASSWORD", "Marc@1234")
    
    async with AsyncSessionLocal() as db: # type: AsyncSession
        for email in admin_emails:
            stmt = select(User).where(User.email == email)
            result = await db.execute(stmt)
            existing_user = result.scalar_one_or_none()
            
            if existing_user is None:
                new_admin = User(
                    id=f"usr-admin-{uuid.uuid4().hex[:8]}",
                    email=email,
                    password_hash=get_password_hash(admin_password),
                    role=UserRole.ADMIN,
                    full_name=f"System Administrator ({email.split('@')[0]})",
                    phone="9876543210",
                    is_active=True,
                )
                db.add(new_admin)
            else:
                # Ensure existing user has server-authoritative ADMIN role and updated password
                existing_user.role = UserRole.ADMIN
                existing_user.is_active = True
                existing_user.password_hash = get_password_hash(admin_password)
                db.add(existing_user)
        
        await db.commit()
        print("[RouteMate] Mandatory Admin accounts verified & provisioned with server-authoritative ADMIN role.")
