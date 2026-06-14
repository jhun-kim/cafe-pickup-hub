from fastapi import APIRouter, HTTPException, status

from cafe_pickup_hub.models import HealthResponse, HubId, HubListing, PickupHub
from cafe_pickup_hub.sample_data import SAMPLE_HUBS, SAMPLE_LISTINGS

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="cafe-pickup-hub-api",
        sample_hubs=len(SAMPLE_HUBS),
    )


@router.get("/api/hubs", response_model=tuple[PickupHub, ...])
def list_hubs() -> tuple[PickupHub, ...]:
    return SAMPLE_HUBS


@router.get("/api/hubs/{hub_id}", response_model=PickupHub)
def get_hub(hub_id: str) -> PickupHub:
    parsed_hub_id = HubId(hub_id)
    for hub in SAMPLE_HUBS:
        if hub.id == parsed_hub_id:
            return hub
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Pickup hub not found",
    )


@router.get("/api/listings", response_model=tuple[HubListing, ...])
def list_listings() -> tuple[HubListing, ...]:
    return SAMPLE_LISTINGS
