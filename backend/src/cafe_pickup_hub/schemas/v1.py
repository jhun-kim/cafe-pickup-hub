from pydantic import BaseModel, ConfigDict, Field

from cafe_pickup_hub.domain.models import (
    PackageStatus,
    PickupAuthorizationStatus,
    PickupRequestStatus,
    StorageSlotStatus,
)


class ApiSchema(BaseModel):
    model_config = ConfigDict(frozen=True, from_attributes=True)


class HealthV1Response(ApiSchema):
    status: str
    service: str
    api_version: str
    sample_hubs: int = Field(ge=0)
    sample_pickup_requests: int = Field(ge=0)


class StorageSlotResponse(ApiSchema):
    id: str
    hub_id: str
    label: str
    status: StorageSlotStatus
    package_size: str


class HubResponse(ApiSchema):
    id: str
    host_id: str
    cafe_name: str
    neighborhood: str
    address: str
    walk_minutes_from_station: int = Field(ge=0)
    rating: float = Field(ge=0, le=5)
    open_until: str
    available_slots: int = Field(ge=0)
    price_per_day_krw: int = Field(ge=0)
    trust_badges: tuple[str, ...]
    storage_slots: tuple[StorageSlotResponse, ...]


class PackageResponse(ApiSchema):
    id: str
    pickup_request_id: str
    storage_slot_id: str
    status: PackageStatus
    size_label: str
    arrival_note: str


class PaymentResponse(ApiSchema):
    id: str
    pickup_request_id: str
    amount_krw: int = Field(ge=0)
    status: str


class PickupAuthorizationResponse(ApiSchema):
    id: str
    pickup_request_id: str
    authorized_picker_name: str
    status: PickupAuthorizationStatus
    code_hint: str
    expires_at: str


class PickupRequestResponse(ApiSchema):
    id: str
    user_id: str
    hub_id: str
    status: PickupRequestStatus
    package: PackageResponse
    payment: PaymentResponse
    authorizations: tuple[PickupAuthorizationResponse, ...]
    pickup_code: str
    pickup_window: str
