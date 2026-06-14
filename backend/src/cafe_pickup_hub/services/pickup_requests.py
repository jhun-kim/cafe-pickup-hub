from dataclasses import dataclass

from cafe_pickup_hub.domain.models import (
    Package,
    PackageStatus,
    Payment,
    PickupRequest,
    PickupRequestStatus,
)
from cafe_pickup_hub.schemas import PickupRequestCreateRequest
from cafe_pickup_hub.services.catalog import CatalogService, get_catalog_service
from cafe_pickup_hub.services.repository import InMemoryPickupRequestRepository
from cafe_pickup_hub.services.sample_data import SAMPLE_PICKUP_REQUESTS


@dataclass(frozen=True, slots=True)
class HubNotFoundError(Exception):
    hub_id: str

    def __str__(self) -> str:
        return f"Hub {self.hub_id} not found"


@dataclass(frozen=True, slots=True)
class PickupRequestService:
    repository: InMemoryPickupRequestRepository
    catalog_service: CatalogService

    def list_pickup_requests(self) -> tuple[PickupRequest, ...]:
        return self.repository.list_pickup_requests()

    def create_pickup_request(self, payload: PickupRequestCreateRequest) -> PickupRequest:
        hub = next((candidate for candidate in self.catalog_service.list_hubs() if candidate.id == payload.hub_id), None)
        if hub is None:
            raise HubNotFoundError(hub_id=payload.hub_id)

        request_index = len(self.repository.list_pickup_requests()) + 1
        request_id = f"pickup-created-{request_index:03d}"
        slot = hub.storage_slots[0]
        pickup_request = PickupRequest(
            id=request_id,
            user_id=payload.user_id,
            hub_id=payload.hub_id,
            status=PickupRequestStatus.CONFIRMED,
            package=Package(
                id=f"pkg-created-{request_index:03d}",
                pickup_request_id=request_id,
                storage_slot_id=slot.id,
                status=PackageStatus.EXPECTED,
                size_label=payload.package_size,
                arrival_note=payload.delivery_note,
            ),
            payment=Payment(
                id=f"pay-created-{request_index:03d}",
                pickup_request_id=request_id,
                amount_krw=hub.price_per_day_krw,
                status="authorized",
            ),
            authorizations=(),
            pickup_code="pending",
            pickup_window=payload.pickup_window,
        )
        return self.repository.add_pickup_request(pickup_request)


_REPOSITORY = InMemoryPickupRequestRepository(initial_pickup_requests=SAMPLE_PICKUP_REQUESTS)


def get_pickup_request_service() -> PickupRequestService:
    return PickupRequestService(repository=_REPOSITORY, catalog_service=get_catalog_service())


def get_pickup_request_repository() -> InMemoryPickupRequestRepository:
    return _REPOSITORY
