from dataclasses import dataclass, field

from cafe_pickup_hub.domain.models import PickupAuthorization, PickupRequest


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

    def add_authorization(self, pickup_request_id: str, authorization: PickupAuthorization) -> PickupAuthorization:
        pickup_request = self.get_pickup_request(pickup_request_id)
        if pickup_request is None:
            return authorization
        updated_request = pickup_request.model_copy(
            update={"authorizations": (*pickup_request.authorizations, authorization)},
        )
        self.update_pickup_request(updated_request)
        return authorization

    def list_authorizations(self, pickup_request_id: str | None) -> tuple[PickupAuthorization, ...]:
        authorizations = tuple(
            authorization
            for pickup_request in self.list_pickup_requests()
            for authorization in pickup_request.authorizations
            if pickup_request_id is None or authorization.pickup_request_id == pickup_request_id
        )
        return authorizations

    def get_authorization(self, authorization_id: str) -> PickupAuthorization | None:
        return next(
            (authorization for authorization in self.list_authorizations(None) if authorization.id == authorization_id),
            None,
        )

    def update_authorization(self, authorization: PickupAuthorization) -> PickupAuthorization:
        pickup_request = self.get_pickup_request(authorization.pickup_request_id)
        if pickup_request is None:
            return authorization
        updated_authorizations = tuple(
            authorization if item.id == authorization.id else item for item in pickup_request.authorizations
        )
        self.update_pickup_request(pickup_request.model_copy(update={"authorizations": updated_authorizations}))
        return authorization
