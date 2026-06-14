from fastapi import APIRouter

from cafe_pickup_hub.domain.models import PickupRequest
from cafe_pickup_hub.schemas import PickupRequestResponse
from cafe_pickup_hub.services import PickupRequestService, get_pickup_request_service

router = APIRouter(tags=["v1-pickup-requests"])


@router.get("/pickup-requests", response_model=tuple[PickupRequestResponse, ...])
def list_pickup_requests() -> tuple[PickupRequest, ...]:
    service: PickupRequestService = get_pickup_request_service()
    return service.list_pickup_requests()
