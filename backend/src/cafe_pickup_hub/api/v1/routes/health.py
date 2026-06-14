from fastapi import APIRouter

from cafe_pickup_hub.schemas import HealthV1Response
from cafe_pickup_hub.services import CatalogService, PickupRequestService
from cafe_pickup_hub.services import get_catalog_service, get_pickup_request_service

router = APIRouter(tags=["v1-health"])


@router.get("/health", response_model=HealthV1Response)
def health() -> HealthV1Response:
    catalog_service: CatalogService = get_catalog_service()
    pickup_request_service: PickupRequestService = get_pickup_request_service()
    return HealthV1Response(
        status="ok",
        service="cafe-pickup-hub-api",
        api_version="v1",
        sample_hubs=len(catalog_service.list_hubs()),
        sample_pickup_requests=len(pickup_request_service.list_pickup_requests()),
    )
