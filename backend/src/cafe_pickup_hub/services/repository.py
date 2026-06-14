from dataclasses import dataclass, field

from cafe_pickup_hub.domain.models import PickupRequest


@dataclass(slots=True)
class InMemoryPickupRequestRepository:
    initial_pickup_requests: tuple[PickupRequest, ...]
    created_pickup_requests: list[PickupRequest] = field(default_factory=list)

    def list_pickup_requests(self) -> tuple[PickupRequest, ...]:
        return (*self.initial_pickup_requests, *tuple(self.created_pickup_requests))

    def add_pickup_request(self, pickup_request: PickupRequest) -> PickupRequest:
        self.created_pickup_requests.append(pickup_request)
        return pickup_request
