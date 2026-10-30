from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timezone
import uuid
from app.models.route_memory import RouteMemory, RouteMemoryConfirmation, MemoryCategory, MemoryStatus
from app.models.user import User


class RouteMemoryService:
    @staticmethod
    async def get_memories(
        db: AsyncSession,
        category: Optional[str] = None
    ) -> List[RouteMemory]:
        stmt = select(RouteMemory).order_by(desc(RouteMemory.created_at))
        if category and category.upper() != "ALL":
            try:
                cat_enum = MemoryCategory[category.upper()]
                stmt = stmt.where(RouteMemory.category == cat_enum)
            except KeyError:
                pass
        
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def create_memory(
        db: AsyncSession,
        user: User,
        title: str,
        category: MemoryCategory,
        description: str,
        latitude: float,
        longitude: float,
        route_corridor: str = "Active Route",
        kilometer_marker: float = 0.0
    ) -> RouteMemory:
        memory = RouteMemory(
            id=f"mem-{uuid.uuid4().hex[:12]}",
            title=title,
            category=category,
            status=MemoryStatus.ACTIVE,
            route_corridor=route_corridor,
            kilometer_marker=kilometer_marker,
            description=description,
            latitude=latitude,
            longitude=longitude,
            reported_by_user_id=user.id,
            reported_by_name=user.full_name,
            confirmations=1,
            confidence_percent=70,
            last_confirmed_at=datetime.now(timezone.utc)
        )
        db.add(memory)
        await db.commit()
        await db.refresh(memory)
        return memory

    @staticmethod
    async def confirm_memory(
        db: AsyncSession,
        user: User,
        memory_id: str,
        action: str  # 'STILL_THERE' | 'REPORT_CLEARED'
    ) -> RouteMemory:
        stmt = select(RouteMemory).where(RouteMemory.id == memory_id)
        res = await db.execute(stmt)
        memory = res.scalar_one_or_none()

        if not memory:
            raise ValueError("Route memory not found")

        # Record confirmation action
        conf = RouteMemoryConfirmation(
            id=f"conf-{uuid.uuid4().hex[:12]}",
            memory_id=memory.id,
            user_id=user.id,
            action=action.upper()
        )
        db.add(conf)

        if action.upper() == "STILL_THERE":
            memory.confirmations += 1
            memory.confidence_percent = min(99, memory.confidence_percent + 2)
            memory.last_confirmed_at = datetime.now(timezone.utc)
            if memory.status != MemoryStatus.ACTIVE:
                memory.status = MemoryStatus.ACTIVE
        elif action.upper() == "REPORT_CLEARED":
            memory.confidence_percent = max(10, memory.confidence_percent - 15)
            if memory.confidence_percent <= 25:
                memory.status = MemoryStatus.CLEARED

        await db.commit()
        await db.refresh(memory)
        return memory
