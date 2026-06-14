from pydantic import BaseModel, ConfigDict, Field

from cafe_pickup_hub.domain.models import (
    AdminTrustAction,
    HostOperationAction,
    IncidentStatus,
    PackageStatus,
    PickupAuthorizationStatus,
    PickupRequestStatus,
    RiskLevel,
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


class PickupRequestCreateRequest(ApiSchema):
    hub_id: str = Field(min_length=1)
    user_id: str = Field(min_length=1)
    package_size: str = Field(min_length=1)
    pickup_window: str = Field(min_length=1)
    delivery_note: str = Field(min_length=1)


class PickupAuthorizationCreateRequest(ApiSchema):
    pickup_request_id: str = Field(min_length=1)
    authorized_picker_name: str = Field(min_length=1)
    expires_at: str = Field(min_length=1)


class PickupAuthorizationConsumeRequest(ApiSchema):
    one_time_code: str = Field(min_length=1)


class PickupAuthorizationCreateResponse(PickupAuthorizationResponse):
    one_time_code: str = Field(min_length=1)


class HostOperationActionRequest(ApiSchema):
    action: HostOperationAction
    storage_slot_id: str | None = Field(default=None, min_length=1)
    pickup_code: str | None = Field(default=None, min_length=1)
    note: str = Field(default="", max_length=240)


class HostOperationSummaryResponse(ApiSchema):
    action: HostOperationAction
    label: str
    priority: int = Field(ge=1)
    next_action: HostOperationAction | None
    safety_note: str


class HostOperationItemResponse(ApiSchema):
    hub: HubResponse
    pickup_request: PickupRequestResponse
    operation: HostOperationSummaryResponse


class IncidentReportResponse(ApiSchema):
    id: str
    pickup_request_id: str
    hub_id: str
    status: IncidentStatus
    reason: str
    severity: str


class RiskRecordResponse(ApiSchema):
    id: str
    incident_id: str
    level: RiskLevel
    signal: str
    hold_payment: bool
    hold_settlement: bool


class AdminAuditLogResponse(ApiSchema):
    id: str
    admin_user_id: str
    action: str
    entity_type: str
    entity_id: str
    note: str


class AdminTrustSummaryResponse(ApiSchema):
    open_incidents: int = Field(ge=0)
    high_risk_items: int = Field(ge=0)
    audit_events: int = Field(ge=0)


class AdminTrustItemResponse(ApiSchema):
    incident: IncidentReportResponse
    risk: RiskRecordResponse
    latest_audit_log: AdminAuditLogResponse | None
    recommended_action: AdminTrustAction | None


class AdminTrustQueueResponse(ApiSchema):
    summary: AdminTrustSummaryResponse
    items: tuple[AdminTrustItemResponse, ...]
    audit_logs: tuple[AdminAuditLogResponse, ...]


class AdminTrustActionRequest(ApiSchema):
    action: AdminTrustAction
    admin_user_id: str = Field(min_length=1)
    note: str = Field(min_length=1, max_length=240)
