from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.route_memory import MemoryCategory
from app.schemas.route_memory import RouteMemoryCreate, RouteMemoryConfirm, RouteMemoryRead
from app.services.route_memory_service import RouteMemoryService

router = APIRouter()


@router.get("", response_model=List[RouteMemoryRead])
async def list_route_memories(
    category: Optional[str] = Query(None, description="ALL | HAZARD | DETOUR | ROAD_CLOSURE | FLOOD | BRIDGE | CONSTRUCTION | FUEL | HOSPITAL | POLICE | LANDMARK"),
    db: AsyncSession = Depends(get_db)
):
    return await RouteMemoryService.get_memories(db=db, category=category)


@router.post("", response_model=RouteMemoryRead, status_code=status.HTTP_201_CREATED)
async def create_route_memory(
    body: RouteMemoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await RouteMemoryService.create_memory(
        db=db,
        user=current_user,
        title=body.title,
        category=body.category,
        description=body.description,
        latitude=body.latitude,
        longitude=body.longitude,
        route_corridor=body.route_corridor,
        kilometer_marker=body.kilometer_marker
    )


@router.post("/{memory_id}/confirm", response_model=RouteMemoryRead)
async def confirm_route_memory(
    memory_id: str,
    body: RouteMemoryConfirm,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await RouteMemoryService.confirm_memory(
            db=db,
            user=current_user,
            memory_id=memory_id,
            action=body.action
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
