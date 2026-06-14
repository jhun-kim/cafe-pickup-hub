from typing import TypeVar, assert_never

from cafe_pickup_hub.domain.errors import InvalidStateTransitionError
from cafe_pickup_hub.domain.models import (
    IncidentStatus,
    PackageStatus,
    PickupAuthorizationStatus,
    PickupRequestStatus,
)

TransitionTarget = TypeVar("TransitionTarget")


def transition_package_status(current: PackageStatus, target: PackageStatus) -> PackageStatus:
    match current:
        case PackageStatus.EXPECTED:
            allowed = (PackageStatus.RECEIVED, PackageStatus.NOT_RECEIVED, PackageStatus.DISPUTED)
        case PackageStatus.RECEIVED:
            allowed = (PackageStatus.PICKED_UP, PackageStatus.DISPUTED)
        case PackageStatus.PICKED_UP | PackageStatus.NOT_RECEIVED | PackageStatus.DISPUTED:
            allowed = ()
        case unreachable:
            assert_never(unreachable)
    return _transition("Package", current.value, target.value, target, allowed)


def transition_pickup_request_status(
    current: PickupRequestStatus,
    target: PickupRequestStatus,
) -> PickupRequestStatus:
    match current:
        case PickupRequestStatus.DRAFT:
            allowed = (PickupRequestStatus.CONFIRMED, PickupRequestStatus.CANCELED, PickupRequestStatus.PAYMENT_FAILED)
        case PickupRequestStatus.CONFIRMED:
            allowed = (PickupRequestStatus.READY_FOR_PICKUP, PickupRequestStatus.CANCELED, PickupRequestStatus.EXPIRED)
        case PickupRequestStatus.READY_FOR_PICKUP:
            allowed = (PickupRequestStatus.COMPLETED, PickupRequestStatus.EXPIRED, PickupRequestStatus.DISPUTED)
        case (
            PickupRequestStatus.COMPLETED
            | PickupRequestStatus.CANCELED
            | PickupRequestStatus.EXPIRED
            | PickupRequestStatus.DISPUTED
            | PickupRequestStatus.PAYMENT_FAILED
        ):
            allowed = ()
        case unreachable:
            assert_never(unreachable)
    return _transition("PickupRequest", current.value, target.value, target, allowed)


def transition_pickup_authorization_status(
    current: PickupAuthorizationStatus,
    target: PickupAuthorizationStatus,
) -> PickupAuthorizationStatus:
    match current:
        case PickupAuthorizationStatus.ACTIVE:
            allowed = (
                PickupAuthorizationStatus.USED,
                PickupAuthorizationStatus.EXPIRED,
                PickupAuthorizationStatus.REVOKED,
            )
        case PickupAuthorizationStatus.USED | PickupAuthorizationStatus.EXPIRED | PickupAuthorizationStatus.REVOKED:
            allowed = ()
        case unreachable:
            assert_never(unreachable)
    return _transition("PickupAuthorization", current.value, target.value, target, allowed)


def transition_incident_status(current: IncidentStatus, target: IncidentStatus) -> IncidentStatus:
    match current:
        case IncidentStatus.OPEN:
            allowed = (IncidentStatus.UNDER_REVIEW, IncidentStatus.RESOLVED, IncidentStatus.ESCALATED)
        case IncidentStatus.UNDER_REVIEW:
            allowed = (IncidentStatus.RESOLVED, IncidentStatus.ESCALATED)
        case IncidentStatus.RESOLVED | IncidentStatus.ESCALATED:
            allowed = ()
        case unreachable:
            assert_never(unreachable)
    return _transition("IncidentReport", current.value, target.value, target, allowed)


def _transition(
    entity: str,
    current: str,
    target_name: str,
    target: TransitionTarget,
    allowed: tuple[TransitionTarget, ...],
) -> TransitionTarget:
    if target in allowed:
        return target
    raise InvalidStateTransitionError(entity=entity, current=current, target=target_name)
