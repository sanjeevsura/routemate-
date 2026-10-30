import json
from typing import Dict, Any
from app.core.config import settings


class GeminiService:
    @staticmethod
    async def extract_hazard(field_notes: str) -> Dict[str, Any]:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured in backend environment")

        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f"""You are the RouteMate Route Intelligence engine. Analyze this observation from a remote road:
"{field_notes}"

Extract a strictly valid JSON object:
{{
  "title": "Short headline (max 6 words)",
  "category": "HAZARD" or "DETOUR" or "ROAD_CLOSURE" or "FLOOD" or "BRIDGE" or "CONSTRUCTION" or "LANDMARK",
  "confidencePercent": integer between 60 and 95,
  "actionAdvice": "1 sentence practical guidance for other drivers"
}}
Output strictly valid JSON with no markdown formatting."""

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt
            )
            raw = response.text or "{}"
            cleaned = raw.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
        except Exception as e:
            raise RuntimeError(f"Gemini hazard extraction failed: {str(e)}")
