from fastapi import APIRouter

from cafe_pickup_hub.domain.models import Hub
from cafe_pickup_hub.schemas import HubResponse
from cafe_pickup_hub.services import CatalogService, get_catalog_service

router = APIRouter(tags=["v1-hubs"])


@router.get("/hubs", response_model=tuple[HubResponse, ...])
def list_hubs() -> tuple[Hub, ...]:
    service: CatalogService = get_catalog_service()
    return service.list_hubs()
