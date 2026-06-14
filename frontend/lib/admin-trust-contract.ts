import type { ApiDataSource, ApiResult } from "@/lib/api-contract"

export type ApiIncidentStatus = "open" | "under_review" | "resolved" | "escalated"
export type ApiRiskLevel = "low" | "medium" | "high"
export type ApiAdminTrustAction = "start_review" | "resolve" | "escalate"

export type ApiIncidentReport = {
  readonly id: string
  readonly pickupRequestId: string
  readonly hubId: string
  readonly status: ApiIncidentStatus
  readonly reason: string
  readonly severity: string
}

export type ApiRiskRecord = {
  readonly id: string
  readonly incidentId: string
  readonly level: ApiRiskLevel
  readonly signal: string
  readonly holdPayment: boolean
  readonly holdSettlement: boolean
}

export type ApiAdminAuditLog = {
  readonly id: string
  readonly adminUserId: string
  readonly action: string
  readonly entityType: string
  readonly entityId: string
  readonly note: string
}

export type ApiAdminTrustSummary = {
  readonly openIncidents: number
  readonly highRiskItems: number
  readonly auditEvents: number
}

export type ApiAdminTrustItem = {
  readonly incident: ApiIncidentReport
  readonly risk: ApiRiskRecord
  readonly latestAuditLog: ApiAdminAuditLog | null
  readonly recommendedAction: ApiAdminTrustAction | null
}

export type AdminTrustContracts = {
  readonly summary: ApiAdminTrustSummary
  readonly items: readonly ApiAdminTrustItem[]
  readonly auditLogs: readonly ApiAdminAuditLog[]
}

export type AdminTrustResult = ApiResult<AdminTrustContracts>

export type AdminTrustSource = ApiDataSource

export type AdminTrustActionInput = {
  readonly incidentId: string
  readonly action: ApiAdminTrustAction
  readonly adminUserId: string
  readonly note: string
}
