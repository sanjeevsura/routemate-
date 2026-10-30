import httpx
from typing import List
from app.core.config import settings
from app.schemas.route import GeocodingResponse, GeocodingFeature


class GeocodingService:
    @staticmethod
    async def search(query: str, limit: int = 6) -> GeocodingResponse:
        if not query or len(query.strip()) < 2:
            return GeocodingResponse(results=[])

        url = f"{settings.PHOTON_ENDPOINT}/?q={query}&limit={limit}"

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                response = await client.get(url)
                if response.status_code != 200:
                    return GeocodingResponse(results=[])

                data = response.json()
                features = data.get("features", [])
                results: List[GeocodingFeature] = []

                for feat in features:
                    props = feat.get("properties", {})
                    geom = feat.get("geometry", {})
                    coords = geom.get("coordinates", [0, 0])

                    name = props.get("name") or props.get("city") or props.get("street") or "Location"
                    state = props.get("state") or props.get("district")
                    country = props.get("country")
                    formatted = ", ".join(filter(None, [name, state, country]))

                    results.append(
                        GeocodingFeature(
                            name=name,
                            state=state,
                            country=country,
                            latitude=coords[1],
                            longitude=coords[0],
                            formatted=formatted
                        )
                    )

                return GeocodingResponse(results=results)
        except Exception:
            return GeocodingResponse(results=[])

    @staticmethod
    async def search_nearby(lat: float, lon: float, category: str = "hospital", limit: int = 10) -> List[dict]:
        from app.services.guide_service import calculate_haversine_distance
        url = f"{settings.PHOTON_ENDPOINT}/?q={category}&lat={lat}&lon={lon}&limit={limit}"

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                response = await client.get(url)
                if response.status_code != 200:
                    return []

                data = response.json()
                features = data.get("features", [])
                results = []

                for feat in features:
                    props = feat.get("properties", {})
                    geom = feat.get("geometry", {})
                    coords = geom.get("coordinates", [0, 0])

                    name = props.get("name") or props.get("street") or f"{category.capitalize()} Facility"
                    state = props.get("state") or props.get("city")
                    country = props.get("country")
                    formatted = ", ".join(filter(None, [name, state, country]))
                    p_lat = coords[1]
                    p_lon = coords[0]

                    dist = calculate_haversine_distance(lat, lon, p_lat, p_lon)

                    results.append({
                        "name": name,
                        "category": category,
                        "latitude": p_lat,
                        "longitude": p_lon,
                        "formatted_address": formatted,
                        "distance_km": dist
                    })

                results.sort(key=lambda x: x["distance_km"])
                return results
        except Exception:
            return []
