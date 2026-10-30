from pydantic import BaseModel
from datetime import datetime
from app.models.request import RequestStatus


class GuideRequestCreate(BaseModel):
    guide_id: str
    origin_name: str = "Current Location"
    destination_name: str = "Selected Destination"
    distance_km: float = 0.0


class GuideRequestRespond(BaseModel):
    action: str  # 'ACCEPT' or 'DECLINE'


class GuideRequestRead(BaseModel):
    id: str
    traveller_id: str
    traveller_name: str
    guide_id: str
    origin_name: str
    destination_name: str
    distance_km: float
    offered_price_inr: float
    status: RequestStatus
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True
