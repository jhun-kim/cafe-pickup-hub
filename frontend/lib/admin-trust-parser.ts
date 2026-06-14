import type {
  AdminTrustContracts,
  ApiAdminAuditLog,
  ApiAdminTrustAction,
  ApiAdminTrustItem,
  ApiAdminTrustSummary,
  ApiIncidentReport,
  ApiIncidentStatus,
  ApiRiskLevel,
  ApiRiskRecord,
} from "@/lib/admin-trust-contract"
import { ApiContractError } from "@/lib/api-errors"

export function parseAdminTrustContracts(payload: unknown): AdminTrustContracts {
  if (!isRecord(payload)) {
    throw new ApiContractError("/api/v1/admin/trust", "response is not an object")
  }
  const summary = parseSummary(payload["summary"])
  const items = readArray(payload["items"], parseItem)
  const auditLogs = readArray(payload["audit_logs"] ?? payload["auditLogs"], parseAuditLog)
  return { summary, items, auditLogs }
}

export function parseAdminTrustItem(payload: unknown): ApiAdminTrustItem {
  const item = parseItem(payload)
  if (item === null) {
    throw new ApiContractError("/api/v1/admin/trust", "response is not an admin trust item")
  }
  return item
}

function parseSummary(payload: unknown): ApiAdminTrustSummary {
  if (!isRecord(payload)) {
    throw new ApiContractError("/api/v1/admin/trust", "summary is not an object")
  }
  const openIncidents = readNumber(payload, "open_incidents") ?? readNumber(payload, "openIncidents")
  const highRiskItems = readNumber(payload, "high_risk_items") ?? readNumber(payload, "highRiskItems")
  const auditEvents = readNumber(payload, "audit_events") ?? readNumber(payload, "auditEvents")
  if (openIncidents === null || highRiskItems === null || auditEvents === null) {
    throw new ApiContractError("/api/v1/admin/trust", "summary is missing counts")
  }
  return { openIncidents, highRiskItems, auditEvents }
}

function parseItem(payload: unknown): ApiAdminTrustItem | null {
  if (!isRecord(payload)) {
    return null
  }
  const incident = parseIncident(payload["incident"])
  const risk = parseRisk(payload["risk"])
  const latestAuditLog = parseNullableAuditLog(payload["latest_audit_log"] ?? payload["latestAuditLog"])
  const recommendedAction = readString(payload, "recommended_action") ?? readString(payload, "recommendedAction")
  if (incident === null || risk === null || latestAuditLog === undefined || !isAdminAction(recommendedAction)) {
    return null
  }
  return { incident, risk, latestAuditLog, recommendedAction }
}

function parseIncident(payload: unknown): ApiIncidentReport | null {
  if (!isRecord(payload)) {
    return null
  }
  const id = readString(payload, "id")
  const pickupRequestId = readString(payload, "pickup_request_id") ?? readString(payload, "pickupRequestId")
  const hubId = readString(payload, "hub_id") ?? readString(payload, "hubId")
  const status = readString(payload, "status")
  const reason = readString(payload, "reason")
  const severity = readString(payload, "severity")
  if (id === null || pickupRequestId === null || hubId === null || !isIncidentStatus(status) || reason === null || severity === null) {
    return null
  }
  return { id, pickupRequestId, hubId, status, reason, severity }
}

function parseRisk(payload: unknown): ApiRiskRecord | null {
  if (!isRecord(payload)) {
    return null
  }
  const id = readString(payload, "id")
  const incidentId = readString(payload, "incident_id") ?? readString(payload, "incidentId")
  const level = readString(payload, "level")
  const signal = readString(payload, "signal")
  const holdPayment = readBoolean(payload, "hold_payment") ?? readBoolean(payload, "holdPayment")
  const holdSettlement = readBoolean(payload, "hold_settlement") ?? readBoolean(payload, "holdSettlement")
  if (id === null || incidentId === null || !isRiskLevel(level) || signal === null || holdPayment === null || holdSettlement === null) {
    return null
  }
  return { id, incidentId, level, signal, holdPayment, holdSettlement }
}

function parseNullableAuditLog(payload: unknown): ApiAdminAuditLog | null | undefined {
  if (payload === null) {
    return null
  }
  return parseAuditLog(payload) ?? undefined
}

function parseAuditLog(payload: unknown): ApiAdminAuditLog | null {
  if (!isRecord(payload)) {
    return null
  }
  const id = readString(payload, "id")
  const adminUserId = readString(payload, "admin_user_id") ?? readString(payload, "adminUserId")
  const action = readString(payload, "action")
  const entityType = readString(payload, "entity_type") ?? readString(payload, "entityType")
  const entityId = readString(payload, "entity_id") ?? readString(payload, "entityId")
  const note = readString(payload, "note")
  if (id === null || adminUserId === null || action === null || entityType === null || entityId === null || note === null) {
    return null
  }
  return { id, adminUserId, action, entityType, entityId, note }
}

function readArray<T>(payload: unknown, parser: (item: unknown) => T | null): readonly T[] {
  if (!Array.isArray(payload)) {
    throw new ApiContractError("/api/v1/admin/trust", "response list is not an array")
  }
  return payload.map(parser).filter(isPresent)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === "string" ? value : null
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key]
  return typeof value === "number" ? value : null
}

function readBoolean(record: Record<string, unknown>, key: string): boolean | null {
  const value = record[key]
  return typeof value === "boolean" ? value : null
}

function isIncidentStatus(value: string | null): value is ApiIncidentStatus {
  return value === "open" || value === "under_review" || value === "resolved" || value === "escalated"
}

function isRiskLevel(value: string | null): value is ApiRiskLevel {
  return value === "low" || value === "medium" || value === "high"
}

function isAdminAction(value: string | null): value is ApiAdminTrustAction {
  return value === "start_review" || value === "resolve" || value === "escalate"
}

function isPresent<T>(value: T | null): value is T {
  return value !== null
}
