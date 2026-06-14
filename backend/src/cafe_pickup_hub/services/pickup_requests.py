from dataclasses import dataclass

from cafe_pickup_hub.domain.models import PickupRequest
from cafe_pickup_hub.services.sample_data import SAMPLE_PICKUP_REQUESTS


@dataclass(frozen=True, slots=True)
class PickupRequestService:
    pickup_requests: tuple[PickupRequest, ...]

    def list_pickup_requests(self) -> tuple[PickupRequest, ...]:
        return self.pickup_requests


def get_pickup_request_service() -> PickupRequestService:
    return PickupRequestService(pickup_requests=SAMPLE_PICKUP_REQUESTS)
