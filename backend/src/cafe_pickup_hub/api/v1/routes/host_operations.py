from fastapi import APIRouter, HTTPException, status

from cafe_pickup_hub.domain.errors import InvalidStateTransitionError
from cafe_pickup_hub.schemas import HostOperationActionRequest, HostOperationItemResponse
from cafe_pickup_hub.services import (
    HubNotFoundError,
    HostOperationService,
    PickupRequestNotFoundError,
    StorageSlotNotFoundError,
    get_host_operation_service,
)
from cafe_pickup_hub.services.host_operations import HostOperationItem

router = APIRouter(tags=["v1-host-operations"])


@router.get("/host/operations", response_model=tuple[HostOperationItemResponse, ...])
def list_host_operations() -> tuple[HostOperationItem, ...]:
    service: HostOperationService = get_host_operation_service()
    return service.list_host_operations()


@router.post("/host/operations/{pickup_request_id}/actions", response_model=HostOperationItemResponse)
def apply_host_operation(pickup_request_id: str, payload: HostOperationActionRequest) -> HostOperationItem:
    service: HostOperationService = get_host_operation_service()
    try:
        return service.apply_host_operation(pickup_request_id, payload)
    except (HubNotFoundError, PickupRequestNotFoundError, StorageSlotNotFoundError) as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except InvalidStateTransitionError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
