from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.gemini_service import GeminiService

router = APIRouter()


class HazardExtractionRequest(BaseModel):
    fieldNotes: str


@router.post("/extract-hazard")
async def extract_hazard(req: HazardExtractionRequest):
    if not req.fieldNotes or len(req.fieldNotes.strip()) < 3:
        raise HTTPException(status_code=400, detail="fieldNotes parameter is required")

    try:
        data = await GeminiService.extract_hazard(req.fieldNotes)
        return {
            "success": True,
            "provider": "Google Gemini",
            "extracted": data
        }
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
