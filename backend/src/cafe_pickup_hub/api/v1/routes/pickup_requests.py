from fastapi import APIRouter, HTTPException, status

from cafe_pickup_hub.domain.models import PickupRequest
from cafe_pickup_hub.schemas import PickupRequestCreateRequest, PickupRequestResponse
from cafe_pickup_hub.services import HubNotFoundError, PickupRequestService, get_pickup_request_service

router = APIRouter(tags=["v1-pickup-requests"])


@router.get("/pickup-requests", response_model=tuple[PickupRequestResponse, ...])
def list_pickup_requests() -> tuple[PickupRequest, ...]:
    service: PickupRequestService = get_pickup_request_service()
    return service.list_pickup_requests()


@router.post("/pickup-requests", response_model=PickupRequestResponse, status_code=status.HTTP_201_CREATED)
def create_pickup_request(payload: PickupRequestCreateRequest) -> PickupRequest:
    service: PickupRequestService = get_pickup_request_service()
    try:
        return service.create_pickup_request(payload)
    except HubNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
