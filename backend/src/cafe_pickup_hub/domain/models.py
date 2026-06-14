from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class PackageStatus(StrEnum):
    EXPECTED = "expected"
    RECEIVED = "received"
    PICKED_UP = "picked_up"
    NOT_RECEIVED = "not_received"
    DISPUTED = "disputed"


class PickupRequestStatus(StrEnum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    READY_FOR_PICKUP = "ready_for_pickup"
    COMPLETED = "completed"
    CANCELED = "canceled"
    EXPIRED = "expired"
    DISPUTED = "disputed"
    PAYMENT_FAILED = "payment_failed"


class PickupAuthorizationStatus(StrEnum):
    ACTIVE = "active"
    USED = "used"
    EXPIRED = "expired"
    REVOKED = "revoked"


class IncidentStatus(StrEnum):
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class StorageSlotStatus(StrEnum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    OCCUPIED = "occupied"
    OUT_OF_SERVICE = "out_of_service"


class HostOperationAction(StrEnum):
    RECEIVE_PACKAGE = "receive_package"
    ASSIGN_STORAGE = "assign_storage"
    COMPLETE_HANDOFF = "complete_handoff"


class DomainModel(BaseModel):
    model_config = ConfigDict(frozen=True)


class User(DomainModel):
    id: str
    display_name: str
    phone_last4: str


class Host(DomainModel):
    id: str
    business_name: str
    owner_user_id: str
    approved: bool


class StorageSlot(DomainModel):
    id: str
    hub_id: str
    label: str
    status: StorageSlotStatus
    package_size: str


class Hub(DomainModel):
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
    storage_slots: tuple[StorageSlot, ...]


class Package(DomainModel):
    id: str
    pickup_request_id: str
    storage_slot_id: str
    status: PackageStatus
    size_label: str
    arrival_note: str


class PickupAuthorization(DomainModel):
    id: str
    pickup_request_id: str
    authorized_picker_name: str
    status: PickupAuthorizationStatus
    code_hint: str
    expires_at: str


class Payment(DomainModel):
    id: str
    pickup_request_id: str
    amount_krw: int = Field(ge=0)
    status: str


class PickupRequest(DomainModel):
    id: str
    user_id: str
    hub_id: str
    status: PickupRequestStatus
    package: Package
    payment: Payment
    authorizations: tuple[PickupAuthorization, ...]
    pickup_code: str
    pickup_window: str


class Settlement(DomainModel):
    id: str
    host_id: str
    hub_id: str
    amount_krw: int = Field(ge=0)
    status: str


class Review(DomainModel):
    id: str
    user_id: str
    hub_id: str
    pickup_request_id: str
    rating: int = Field(ge=1, le=5)
    comment: str


class IncidentReport(DomainModel):
    id: str
    pickup_request_id: str
    hub_id: str
    status: IncidentStatus
    reason: str
    severity: str


class Notification(DomainModel):
    id: str
    user_id: str
    title: str
    body: str
    read: bool


class AdminAuditLog(DomainModel):
    id: str
    admin_user_id: str
    action: str
    entity_type: str
    entity_id: str
