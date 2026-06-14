from fastapi import APIRouter, HTTPException, Query, status

from cafe_pickup_hub.domain.errors import InvalidStateTransitionError
from cafe_pickup_hub.domain.models import PickupAuthorization
from cafe_pickup_hub.schemas import (
    PickupAuthorizationConsumeRequest,
    PickupAuthorizationCreateRequest,
    PickupAuthorizationCreateResponse,
    PickupAuthorizationResponse,
)
from cafe_pickup_hub.services.pickup_authorizations import (
    CreatedPickupAuthorization,
    PickupAuthorizationNotFoundError,
    PickupAuthorizationService,
    PickupAuthorizationUnavailableError,
    PickupAuthorizationWrongCodeError,
    PickupRequestNotReadyError,
    get_pickup_authorization_service,
)

router = APIRouter(tags=["v1-pickup-authorizations"])


@router.get("/pickup-authorizations", response_model=tuple[PickupAuthorizationResponse, ...])
def list_pickup_authorizations(
    pickup_request_id: str | None = Query(default=None),
) -> tuple[PickupAuthorization, ...]:
    service: PickupAuthorizationService = get_pickup_authorization_service()
    return service.list_authorizations(pickup_request_id)


@router.post(
    "/pickup-authorizations",
    response_model=PickupAuthorizationCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_pickup_authorization(payload: PickupAuthorizationCreateRequest) -> PickupAuthorizationCreateResponse:
    service: PickupAuthorizationService = get_pickup_authorization_service()
    try:
        created = service.create_authorization(payload)
        return to_create_response(created)
    except PickupAuthorizationNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except PickupRequestNotReadyError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.post("/pickup-authorizations/{authorization_id}/revoke", response_model=PickupAuthorizationResponse)
def revoke_pickup_authorization(authorization_id: str) -> PickupAuthorization:
    service: PickupAuthorizationService = get_pickup_authorization_service()
    try:
        return service.revoke_authorization(authorization_id)
    except PickupAuthorizationNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except InvalidStateTransitionError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.post("/pickup-authorizations/{authorization_id}/consume", response_model=PickupAuthorizationResponse)
def consume_pickup_authorization(
    authorization_id: str,
    payload: PickupAuthorizationConsumeRequest,
) -> PickupAuthorization:
    service: PickupAuthorizationService = get_pickup_authorization_service()
    try:
        return service.consume_authorization(authorization_id, payload.one_time_code)
    except PickupAuthorizationNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except PickupAuthorizationWrongCodeError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except (InvalidStateTransitionError, PickupAuthorizationUnavailableError) as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


def to_create_response(created: CreatedPickupAuthorization) -> PickupAuthorizationCreateResponse:
    return PickupAuthorizationCreateResponse(
        id=created.authorization.id,
        pickup_request_id=created.authorization.pickup_request_id,
        authorized_picker_name=created.authorization.authorized_picker_name,
        status=created.authorization.status,
        code_hint=created.authorization.code_hint,
        expires_at=created.authorization.expires_at,
        one_time_code=created.one_time_code,
    )
