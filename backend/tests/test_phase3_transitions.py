import pytest

from cafe_pickup_hub.domain.errors import InvalidStateTransitionError
from cafe_pickup_hub.domain.transitions import (
    transition_incident_status,
    transition_package_status,
    transition_pickup_authorization_status,
    transition_pickup_request_status,
)
from cafe_pickup_hub.domain.models import (
    IncidentStatus,
    PackageStatus,
    PickupAuthorizationStatus,
    PickupRequestStatus,
)


def test_package_transition_allows_expected_host_lifecycle() -> None:
    assert transition_package_status(PackageStatus.EXPECTED, PackageStatus.RECEIVED) == PackageStatus.RECEIVED
    assert transition_package_status(PackageStatus.RECEIVED, PackageStatus.PICKED_UP) == PackageStatus.PICKED_UP


def test_pickup_request_transition_rejects_completion_before_ready() -> None:
    with pytest.raises(InvalidStateTransitionError) as error:
        transition_pickup_request_status(PickupRequestStatus.DRAFT, PickupRequestStatus.COMPLETED)

    assert "PickupRequest" in str(error.value)
    assert "draft -> completed" in str(error.value)


def test_pickup_authorization_transition_supports_revoke_before_use_only() -> None:
    assert (
        transition_pickup_authorization_status(
            PickupAuthorizationStatus.ACTIVE,
            PickupAuthorizationStatus.REVOKED,
        )
        == PickupAuthorizationStatus.REVOKED
    )

    with pytest.raises(InvalidStateTransitionError):
        transition_pickup_authorization_status(PickupAuthorizationStatus.USED, PickupAuthorizationStatus.REVOKED)


def test_incident_transition_supports_resolution_or_escalation_from_review() -> None:
    assert transition_incident_status(IncidentStatus.OPEN, IncidentStatus.UNDER_REVIEW) == IncidentStatus.UNDER_REVIEW
    assert transition_incident_status(IncidentStatus.UNDER_REVIEW, IncidentStatus.RESOLVED) == IncidentStatus.RESOLVED
    assert transition_incident_status(IncidentStatus.UNDER_REVIEW, IncidentStatus.ESCALATED) == IncidentStatus.ESCALATED

    with pytest.raises(InvalidStateTransitionError):
        transition_incident_status(IncidentStatus.RESOLVED, IncidentStatus.OPEN)
