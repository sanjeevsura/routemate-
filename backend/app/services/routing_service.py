import httpx
from typing import Dict, Any, List
from app.core.config import settings
from app.schemas.route import DirectionsResponse, StepManeuver


class RoutingService:
    @staticmethod
    async def get_directions(from_lat: float, from_lon: float, to_lat: float, to_lon: float) -> DirectionsResponse:
        # Coordinate order for OSRM is lon,lat
        url = f"{settings.OSRM_ENDPOINT}/{from_lon},{from_lat};{to_lon},{to_lat}?overview=full&geometries=geojson&steps=true"

        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                raise ValueError(f"Routing provider returned HTTP {response.status_code}")

            data = response.json()
            if not data.get("routes"):
                raise ValueError("No driving route found between the specified coordinates")

            route = data["routes"][0]
            legs = route.get("legs", [{}])[0]
            raw_steps = legs.get("steps", [])

            steps: List[StepManeuver] = []
            for step in raw_steps:
                maneuver = step.get("maneuver", {})
                instruction = maneuver.get("instruction") or f"{maneuver.get('type', '')} {maneuver.get('modifier', '')}".strip()
                steps.append(
                    StepManeuver(
                        instruction=instruction or "Continue along route",
                        distance_m=round(step.get("distance", 0.0), 1),
                        duration_sec=round(step.get("duration", 0.0), 1),
                        name=step.get("name") or "Road Segment"
                    )
                )

            return DirectionsResponse(
                success=True,
                provider="OSRM Open Source Routing Machine",
                distance_km=round(route.get("distance", 0.0) / 1000.0, 1),
                duration_min=round(route.get("duration", 0.0) / 60.0),
                geometry=route.get("geometry", {}),
                steps=steps
            )
