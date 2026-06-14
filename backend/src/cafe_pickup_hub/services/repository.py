from dataclasses import dataclass, field

from cafe_pickup_hub.domain.models import PickupRequest


@dataclass(slots=True)
class InMemoryPickupRequestRepository:
    initial_pickup_requests: tuple[PickupRequest, ...]
    created_pickup_requests: list[PickupRequest] = field(default_factory=list)
    updated_pickup_requests: dict[str, PickupRequest] = field(default_factory=dict)

    def list_pickup_requests(self) -> tuple[PickupRequest, ...]:
        initial = tuple(self.updated_pickup_requests.get(item.id, item) for item in self.initial_pickup_requests)
        created = tuple(self.updated_pickup_requests.get(item.id, item) for item in self.created_pickup_requests)
        return (*initial, *created)

    def add_pickup_request(self, pickup_request: PickupRequest) -> PickupRequest:
        self.created_pickup_requests.append(pickup_request)
        return pickup_request

    def get_pickup_request(self, pickup_request_id: str) -> PickupRequest | None:
        return next((item for item in self.list_pickup_requests() if item.id == pickup_request_id), None)

    def update_pickup_request(self, pickup_request: PickupRequest) -> PickupRequest:
        self.updated_pickup_requests[pickup_request.id] = pickup_request
        return pickup_request
