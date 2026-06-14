from dataclasses import dataclass, field
from datetime import datetime
from typing import Protocol, assert_never

from cafe_pickup_hub.domain.errors import InvalidStateTransitionError
from cafe_pickup_hub.domain.models import PickupAuthorization, PickupAuthorizationStatus, PickupRequestStatus
from cafe_pickup_hub.domain.transitions import transition_pickup_authorization_status
from cafe_pickup_hub.schemas import PickupAuthorizationCreateRequest
from cafe_pickup_hub.services.pickup_requests import get_pickup_request_repository
from cafe_pickup_hub.services.repository import InMemoryPickupRequestRepository


class Clock(Protocol):
    def now(self) -> datetime: ...


@dataclass(frozen=True, slots=True)
class SystemClock:
    def now(self) -> datetime:
        return datetime.now().astimezone()


@dataclass(frozen=True, slots=True)
class PickupRequestNotReadyError(Exception):
    pickup_request_id: str
    status: str

    def __str__(self) -> str:
        return f"PickupRequest {self.pickup_request_id} is {self.status}, not ready for authorization"


@dataclass(frozen=True, slots=True)
class PickupAuthorizationNotFoundError(Exception):
    authorization_id: str

    def __str__(self) -> str:
        return f"PickupAuthorization {self.authorization_id} not found"


@dataclass(frozen=True, slots=True)
class PickupAuthorizationWrongCodeError(Exception):
    authorization_id: str

    def __str__(self) -> str:
        return f"PickupAuthorization {self.authorization_id} rejected wrong one-time code"


@dataclass(frozen=True, slots=True)
class PickupAuthorizationUnavailableError(Exception):
    authorization_id: str
    status: PickupAuthorizationStatus

    def __str__(self) -> str:
        return f"PickupAuthorization {self.authorization_id} is {self.status.value}"


@dataclass(frozen=True, slots=True)
class CreatedPickupAuthorization:
    authorization: PickupAuthorization
    one_time_code: str


@dataclass(slots=True)
class PickupAuthorizationService:
    repository: InMemoryPickupRequestRepository
    clock: Clock = field(default_factory=SystemClock)
    codes: dict[str, str] = field(default_factory=dict)

    def list_authorizations(self, pickup_request_id: str | None) -> tuple[PickupAuthorization, ...]:
        return self.repository.list_authorizations(pickup_request_id)

    def create_authorization(self, payload: PickupAuthorizationCreateRequest) -> CreatedPickupAuthorization:
        pickup_request = self.repository.get_pickup_request(payload.pickup_request_id)
        if pickup_request is None:
            raise PickupAuthorizationNotFoundError(authorization_id=payload.pickup_request_id)
        match pickup_request.status:
            case PickupRequestStatus.READY_FOR_PICKUP:
                pass
            case (
                PickupRequestStatus.DRAFT
                | PickupRequestStatus.CONFIRMED
                | PickupRequestStatus.COMPLETED
                | PickupRequestStatus.CANCELED
                | PickupRequestStatus.EXPIRED
                | PickupRequestStatus.DISPUTED
                | PickupRequestStatus.PAYMENT_FAILED
            ):
                raise PickupRequestNotReadyError(pickup_request_id=pickup_request.id, status=pickup_request.status.value)
            case unreachable:
                assert_never(unreachable)

        index = len(self.repository.list_authorizations(None)) + 1
        one_time_code = make_one_time_code(index)
        authorization = PickupAuthorization(
            id=f"auth-created-{index:03d}",
            pickup_request_id=payload.pickup_request_id,
            authorized_picker_name=payload.authorized_picker_name,
            status=PickupAuthorizationStatus.ACTIVE,
            code_hint=make_code_hint(one_time_code),
            expires_at=payload.expires_at,
        )
        self.codes[authorization.id] = one_time_code
        return CreatedPickupAuthorization(
            authorization=self.repository.add_authorization(payload.pickup_request_id, authorization),
            one_time_code=one_time_code,
        )

    def revoke_authorization(self, authorization_id: str) -> PickupAuthorization:
        authorization = self.require_authorization(authorization_id)
        updated = authorization.model_copy(
            update={
                "status": transition_pickup_authorization_status(
                    authorization.status,
                    PickupAuthorizationStatus.REVOKED,
                ),
            },
        )
        return self.repository.update_authorization(updated)

    def consume_authorization(self, authorization_id: str, one_time_code: str) -> PickupAuthorization:
        authorization = self.require_authorization(authorization_id)
        self.require_available_authorization(authorization)
        if self.codes.get(authorization.id) != one_time_code:
            raise PickupAuthorizationWrongCodeError(authorization_id=authorization.id)
        updated = authorization.model_copy(
            update={
                "status": transition_pickup_authorization_status(
                    authorization.status,
                    PickupAuthorizationStatus.USED,
                ),
            },
        )
        return self.repository.update_authorization(updated)

    def require_authorization(self, authorization_id: str) -> PickupAuthorization:
        authorization = self.repository.get_authorization(authorization_id)
        if authorization is None:
            raise PickupAuthorizationNotFoundError(authorization_id=authorization_id)
        return authorization

    def require_available_authorization(self, authorization: PickupAuthorization) -> None:
        match authorization.status:
            case PickupAuthorizationStatus.ACTIVE:
                if datetime.fromisoformat(authorization.expires_at) <= self.clock.now():
                    updated = authorization.model_copy(update={"status": PickupAuthorizationStatus.EXPIRED})
                    self.repository.update_authorization(updated)
                    raise PickupAuthorizationUnavailableError(
                        authorization_id=authorization.id,
                        status=PickupAuthorizationStatus.EXPIRED,
                    )
            case (
                PickupAuthorizationStatus.USED
                | PickupAuthorizationStatus.EXPIRED
                | PickupAuthorizationStatus.REVOKED
            ):
                raise PickupAuthorizationUnavailableError(
                    authorization_id=authorization.id,
                    status=authorization.status,
                )
            case unreachable:
                assert_never(unreachable)


def make_one_time_code(index: int) -> str:
    return f"{739000 + index:06d}"


def make_code_hint(one_time_code: str) -> str:
    return f"{one_time_code[:3]}***"


_SERVICE = PickupAuthorizationService(repository=get_pickup_request_repository())


def get_pickup_authorization_service() -> PickupAuthorizationService:
    return _SERVICE
