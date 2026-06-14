from fastapi import FastAPI, HTTPException, status

from cafe_pickup_hub.models import HealthResponse, HubId, HubListing, PickupHub
from cafe_pickup_hub.sample_data import SAMPLE_HUBS, SAMPLE_LISTINGS


def create_app() -> FastAPI:
    app = FastAPI(
        title="Cafe Pickup Hub API",
        summary="Marketplace API for cafes renting spare pickup space.",
        version="0.1.0",
    )

    @app.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(
            status="ok",
            service="cafe-pickup-hub-api",
            sample_hubs=len(SAMPLE_HUBS),
        )

    @app.get("/api/hubs", response_model=tuple[PickupHub, ...])
    def list_hubs() -> tuple[PickupHub, ...]:
        return SAMPLE_HUBS

    @app.get("/api/hubs/{hub_id}", response_model=PickupHub)
    def get_hub(hub_id: str) -> PickupHub:
        parsed_hub_id = HubId(hub_id)
        for hub in SAMPLE_HUBS:
            if hub.id == parsed_hub_id:
                return hub
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pickup hub not found",
        )

    @app.get("/api/listings", response_model=tuple[HubListing, ...])
    def list_listings() -> tuple[HubListing, ...]:
        return SAMPLE_LISTINGS

    return app


app = create_app()
