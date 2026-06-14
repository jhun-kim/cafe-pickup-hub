from dataclasses import dataclass, field

from cafe_pickup_hub.domain.models import AdminAuditLog, IncidentReport, PickupAuthorization, PickupRequest, RiskRecord


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


@dataclass(slots=True)
class InMemoryAdminTrustRepository:
    initial_incidents: tuple[IncidentReport, ...]
    initial_risks: tuple[RiskRecord, ...]
    initial_audit_logs: tuple[AdminAuditLog, ...]
    updated_incidents: dict[str, IncidentReport] = field(default_factory=dict)
    updated_risks: dict[str, RiskRecord] = field(default_factory=dict)
    created_audit_logs: list[AdminAuditLog] = field(default_factory=list)

    def list_incidents(self) -> tuple[IncidentReport, ...]:
        return tuple(self.updated_incidents.get(item.id, item) for item in self.initial_incidents)

    def get_incident(self, incident_id: str) -> IncidentReport | None:
        return next((item for item in self.list_incidents() if item.id == incident_id), None)

    def update_incident(self, incident: IncidentReport) -> IncidentReport:
        self.updated_incidents[incident.id] = incident
        return incident

    def list_risks(self) -> tuple[RiskRecord, ...]:
        return tuple(self.updated_risks.get(item.id, item) for item in self.initial_risks)

    def get_risk_by_incident(self, incident_id: str) -> RiskRecord | None:
        return next((item for item in self.list_risks() if item.incident_id == incident_id), None)

    def update_risk(self, risk: RiskRecord) -> RiskRecord:
        self.updated_risks[risk.id] = risk
        return risk

    def list_audit_logs(self) -> tuple[AdminAuditLog, ...]:
        return (*self.initial_audit_logs, *self.created_audit_logs)

    def add_audit_log(self, audit_log: AdminAuditLog) -> AdminAuditLog:
        self.created_audit_logs.append(audit_log)
        return audit_log
