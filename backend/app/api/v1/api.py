from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    routes,
    geocoding,
    guides,
    requests,
    sessions,
    route_memory,
    sos,
    admin,
    ai,
    websocket,
    complaints
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(routes.router, prefix="/routes", tags=["routes"])
api_router.include_router(geocoding.router, prefix="/geocoding", tags=["geocoding"])
api_router.include_router(guides.router, prefix="/guides", tags=["guides"])
api_router.include_router(requests.router, prefix="/requests", tags=["requests"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(route_memory.router, prefix="/route-memory", tags=["route-memory"])
api_router.include_router(sos.router, prefix="/sos", tags=["sos"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["complaints"])
