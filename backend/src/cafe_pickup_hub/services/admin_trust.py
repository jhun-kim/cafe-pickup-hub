from dataclasses import dataclass
from typing import assert_never

from cafe_pickup_hub.domain.models import (
    AdminAuditLog,
    AdminTrustAction,
    IncidentReport,
    IncidentStatus,
    RiskLevel,
    RiskRecord,
)
from cafe_pickup_hub.domain.transitions import transition_incident_status
from cafe_pickup_hub.schemas import AdminTrustActionRequest
from cafe_pickup_hub.services.repository import InMemoryAdminTrustRepository
from cafe_pickup_hub.services.sample_data import SAMPLE_ADMIN_AUDIT_LOGS, SAMPLE_INCIDENT_REPORTS, SAMPLE_RISK_RECORDS


@dataclass(frozen=True, slots=True)
class AdminTrustSummary:
    open_incidents: int
    high_risk_items: int
    audit_events: int


@dataclass(frozen=True, slots=True)
class AdminTrustItem:
    incident: IncidentReport
    risk: RiskRecord
    latest_audit_log: AdminAuditLog | None
    recommended_action: AdminTrustAction


@dataclass(frozen=True, slots=True)
class AdminTrustQueue:
    summary: AdminTrustSummary
    items: tuple[AdminTrustItem, ...]
    audit_logs: tuple[AdminAuditLog, ...]


@dataclass(frozen=True, slots=True)
class AdminTrustIncidentNotFoundError(Exception):
    incident_id: str

    def __str__(self) -> str:
        return f"IncidentReport {self.incident_id} not found"


@dataclass(slots=True)
class AdminTrustService:
    repository: InMemoryAdminTrustRepository

    def list_trust_queue(self) -> AdminTrustQueue:
        items = tuple(self.to_trust_item(incident) for incident in self.repository.list_incidents())
        audit_logs = self.repository.list_audit_logs()
        return AdminTrustQueue(
            summary=AdminTrustSummary(
                open_incidents=sum(1 for incident in self.repository.list_incidents() if incident.status is IncidentStatus.OPEN),
                high_risk_items=sum(1 for risk in self.repository.list_risks() if risk.level is RiskLevel.HIGH),
                audit_events=len(audit_logs),
            ),
            items=items,
            audit_logs=audit_logs,
        )

    def apply_incident_action(self, incident_id: str, payload: AdminTrustActionRequest) -> AdminTrustItem:
        incident = self.repository.get_incident(incident_id)
        if incident is None:
            raise AdminTrustIncidentNotFoundError(incident_id=incident_id)

        target_status = target_status_for_action(payload.action)
        updated_incident = self.repository.update_incident(
            incident.model_copy(update={"status": transition_incident_status(incident.status, target_status)}),
        )
        risk = self.repository.get_risk_by_incident(incident_id)
        if risk is not None:
            self.repository.update_risk(risk.model_copy(update={"level": risk_level_for_action(payload.action)}))

        audit_index = len(self.repository.list_audit_logs()) + 1
        self.repository.add_audit_log(
            AdminAuditLog(
                id=f"audit-admin-{audit_index:03d}",
                admin_user_id=payload.admin_user_id,
                action=payload.action.value,
                entity_type="IncidentReport",
                entity_id=incident_id,
                note=payload.note,
            ),
        )
        return self.to_trust_item(updated_incident)

    def to_trust_item(self, incident: IncidentReport) -> AdminTrustItem:
        risk = self.repository.get_risk_by_incident(incident.id)
        if risk is None:
            risk = RiskRecord(
                id=f"risk-{incident.id}",
                incident_id=incident.id,
                level=RiskLevel.LOW,
                signal="manual admin review",
                hold_payment=False,
                hold_settlement=False,
            )
        return AdminTrustItem(
            incident=incident,
            risk=risk,
            latest_audit_log=latest_audit_for_entity(self.repository.list_audit_logs(), incident.id),
            recommended_action=recommended_action_for_status(incident.status),
        )


def target_status_for_action(action: AdminTrustAction) -> IncidentStatus:
    match action:
        case AdminTrustAction.START_REVIEW:
            return IncidentStatus.UNDER_REVIEW
        case AdminTrustAction.RESOLVE:
            return IncidentStatus.RESOLVED
        case AdminTrustAction.ESCALATE:
            return IncidentStatus.ESCALATED
        case unreachable:
            assert_never(unreachable)


def risk_level_for_action(action: AdminTrustAction) -> RiskLevel:
    match action:
        case AdminTrustAction.START_REVIEW:
            return RiskLevel.MEDIUM
        case AdminTrustAction.RESOLVE:
            return RiskLevel.LOW
        case AdminTrustAction.ESCALATE:
            return RiskLevel.HIGH
        case unreachable:
            assert_never(unreachable)


def recommended_action_for_status(status: IncidentStatus) -> AdminTrustAction:
    match status:
        case IncidentStatus.OPEN:
            return AdminTrustAction.START_REVIEW
        case IncidentStatus.UNDER_REVIEW:
            return AdminTrustAction.RESOLVE
        case IncidentStatus.RESOLVED | IncidentStatus.ESCALATED:
            return AdminTrustAction.RESOLVE
        case unreachable:
            assert_never(unreachable)


def latest_audit_for_entity(audit_logs: tuple[AdminAuditLog, ...], entity_id: str) -> AdminAuditLog | None:
    return next((log for log in reversed(audit_logs) if log.entity_id == entity_id), None)


_REPOSITORY = InMemoryAdminTrustRepository(
    initial_incidents=SAMPLE_INCIDENT_REPORTS,
    initial_risks=SAMPLE_RISK_RECORDS,
    initial_audit_logs=SAMPLE_ADMIN_AUDIT_LOGS,
)
_SERVICE = AdminTrustService(repository=_REPOSITORY)


def get_admin_trust_service() -> AdminTrustService:
    return _SERVICE
