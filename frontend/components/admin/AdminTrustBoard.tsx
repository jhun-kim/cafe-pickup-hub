"use client"

import type { ApiAdminTrustAction, ApiAdminTrustItem, ApiIncidentStatus, ApiRiskLevel } from "@/lib/admin-trust-contract"
import { parseAdminTrustItem } from "@/lib/admin-trust-parser"
import { useState } from "react"

type AdminTrustBoardProps = {
  readonly apiSourceKind: "api" | "demo"
  readonly initialItems: readonly ApiAdminTrustItem[]
}

type ActionState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading"; readonly incidentId: string }
  | { readonly kind: "success"; readonly incidentId: string; readonly action: ApiAdminTrustAction }
  | { readonly kind: "error"; readonly incidentId: string; readonly message: string }

export function AdminTrustBoard({ apiSourceKind, initialItems }: AdminTrustBoardProps) {
  const [items, setItems] = useState<readonly ApiAdminTrustItem[]>(initialItems)
  const [actionState, setActionState] = useState<ActionState>({ kind: "idle" })
  const isApiBacked = apiSourceKind === "api"

  async function submitAction(item: ApiAdminTrustItem): Promise<void> {
    if (item.recommendedAction === null) {
      setActionState({ kind: "error", incidentId: item.incident.id, message: "종결된 incident에는 실행 가능한 다음 조치가 없습니다." })
      return
    }
    if (!isApiBacked) {
      setActionState({
        kind: "error",
        incidentId: item.incident.id,
        message: "Demo fallback 상태에서는 실제 리스크 판단을 실행하지 않습니다.",
      })
      return
    }

    try {
      setActionState({ kind: "loading", incidentId: item.incident.id })
      const response = await fetch(`/api/admin-trust/incidents/${item.incident.id}/actions`, {
        body: JSON.stringify({
          action: item.recommendedAction,
          admin_user_id: "admin-ops-1",
          note: defaultNote(item.recommendedAction),
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
      const payload: unknown = await response.json()
      if (!response.ok) {
        setActionState({
          kind: "error",
          incidentId: item.incident.id,
          message: readDetail(payload) ?? `관리자 액션 실패: HTTP ${response.status}`,
        })
        return
      }
      const updated = parseAdminTrustItem(payload)
      setItems((current) => current.map((currentItem) => (currentItem.incident.id === updated.incident.id ? updated : currentItem)))
      setActionState({ kind: "success", incidentId: updated.incident.id, action: item.recommendedAction })
    } catch (error) {
      if (error instanceof Error) {
        setActionState({ kind: "error", incidentId: item.incident.id, message: `관리자 액션 실패: ${error.message}` })
        return
      }
      throw error
    }
  }

  return (
    <section className="admin-trust-board" data-admin-trust-mode={apiSourceKind}>
      {!isApiBacked ? (
        <div className="admin-trust-warning" data-noninteractive="demo-admin-action-blocked">
          Demo fallback 데이터입니다. 승인, 보류, 분쟁 처리는 실제 성공처럼 처리하지 않습니다.
        </div>
      ) : null}
      <div className="admin-trust-list">
        {items.map((item) => (
          <article className="admin-trust-card" key={item.incident.id}>
            <div>
              <span className={`risk-dot risk-dot--${item.risk.level}`} data-noninteractive="risk-level" />
              <div>
                <strong>{riskLabel(item.risk.level)} · {statusLabel(item.incident.status)}</strong>
                <p>{item.incident.reason}</p>
              </div>
            </div>
            <dl>
              <div>
                <dt>요청</dt>
                <dd>{item.incident.pickupRequestId}</dd>
              </div>
              <div>
                <dt>Risk signal</dt>
                <dd>{item.risk.signal}</dd>
              </div>
              <div>
                <dt>Hold</dt>
                <dd>{holdLabel(item.risk.holdPayment, item.risk.holdSettlement)}</dd>
              </div>
              <div>
                <dt>Audit</dt>
                <dd>{item.latestAuditLog?.action ?? "대기"}</dd>
              </div>
            </dl>
            {item.recommendedAction === null ? (
              <span className="admin-trust-terminal" data-noninteractive="terminal-admin-trust-item">
                다음 조치 없음
              </span>
            ) : (
              <button
                className="primary-button"
                type="button"
                disabled={!isApiBacked || isLoading(actionState, item.incident.id)}
                onClick={() => {
                  void submitAction(item)
                }}
              >
                {isLoading(actionState, item.incident.id) ? "처리 중" : actionLabel(item.recommendedAction)}
              </button>
            )}
            {actionState.kind === "success" && actionState.incidentId === item.incident.id ? (
              <p className="admin-trust-success" data-admin-action-result="success">
                {actionLabel(actionState.action)} 완료
              </p>
            ) : null}
            {actionState.kind === "error" && actionState.incidentId === item.incident.id ? (
              <p className="admin-trust-error" data-admin-action-result="error">
                {actionState.message}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

function defaultNote(action: ApiAdminTrustAction): string {
  switch (action) {
    case "start_review":
      return "Admin reviewed trust evidence and started manual review"
    case "resolve":
      return "Admin resolved incident after evidence review"
    case "escalate":
      return "Admin escalated incident for senior risk review"
    default:
      return assertNever(action)
  }
}

function actionLabel(action: ApiAdminTrustAction): string {
  switch (action) {
    case "start_review":
      return "검토 시작"
    case "resolve":
      return "해결 처리"
    case "escalate":
      return "상위 검토"
    default:
      return assertNever(action)
  }
}

function statusLabel(status: ApiIncidentStatus): string {
  switch (status) {
    case "open":
      return "열림"
    case "under_review":
      return "검토 중"
    case "resolved":
      return "해결"
    case "escalated":
      return "상위 검토"
    default:
      return assertNever(status)
  }
}

function riskLabel(level: ApiRiskLevel): string {
  switch (level) {
    case "high":
      return "High risk"
    case "medium":
      return "Medium risk"
    case "low":
      return "Low risk"
    default:
      return assertNever(level)
  }
}

function holdLabel(holdPayment: boolean, holdSettlement: boolean): string {
  if (holdPayment && holdSettlement) {
    return "결제+정산 보류"
  }
  if (holdSettlement) {
    return "정산 보류"
  }
  return "모니터링"
}

function isLoading(state: ActionState, incidentId: string): boolean {
  return state.kind === "loading" && state.incidentId === incidentId
}

function readDetail(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null
  }
  const detail = payload["detail"]
  return typeof detail === "string" ? detail : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${value}`)
}
