import type { AdminTrustContracts, AdminTrustResult } from "@/lib/admin-trust-contract"

export function demoAdminTrust(apiBaseUrl: string, reason: string): AdminTrustResult {
  return {
    data: demoAdminTrustContracts(),
    source: { kind: "demo", apiBaseUrl, reason },
  }
}

function demoAdminTrustContracts(): AdminTrustContracts {
  return {
    summary: {
      openIncidents: 2,
      highRiskItems: 1,
      auditEvents: 2,
    },
    items: [
      {
        incident: {
          id: "demo-incident-code",
          pickupRequestId: "demo-pickup-ready",
          hubId: "demo-hub-1",
          status: "open",
          reason: "Demo code mismatch review",
          severity: "urgent",
        },
        risk: {
          id: "demo-risk-code",
          incidentId: "demo-incident-code",
          level: "high",
          signal: "Demo risk signal; no real hold is applied",
          holdPayment: true,
          holdSettlement: true,
        },
        latestAuditLog: {
          id: "demo-audit-code",
          adminUserId: "demo-system",
          action: "demo_created",
          entityType: "IncidentReport",
          entityId: "demo-incident-code",
          note: "Demo fallback only; operator actions are disabled.",
        },
        recommendedAction: null,
      },
      {
        incident: {
          id: "demo-incident-overdue",
          pickupRequestId: "demo-pickup-overdue",
          hubId: "demo-hub-2",
          status: "open",
          reason: "Demo overdue storage watch",
          severity: "watch",
        },
        risk: {
          id: "demo-risk-overdue",
          incidentId: "demo-incident-overdue",
          level: "medium",
          signal: "Demo package is past pickup window",
          holdPayment: false,
          holdSettlement: true,
        },
        latestAuditLog: null,
        recommendedAction: "start_review",
      },
    ],
    auditLogs: [
      {
        id: "demo-audit-code",
        adminUserId: "demo-system",
        action: "demo_created",
        entityType: "IncidentReport",
        entityId: "demo-incident-code",
        note: "Demo fallback only; operator actions are disabled.",
      },
      {
        id: "demo-audit-risk",
        adminUserId: "demo-system",
        action: "demo_hold",
        entityType: "RiskRecord",
        entityId: "demo-risk-code",
        note: "Displayed as non-production trust data.",
      },
    ],
  }
}
