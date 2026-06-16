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
      setActionState({ kind: "error", incidentId: item.incident.id, message: "종결된 분쟁에는 실행 가능한 다음 조치가 없습니다." })
      return
    }
    if (!isApiBacked) {
      setActionState({
        kind: "error",
        incidentId: item.incident.id,
        message: "연결 확인 중에는 리스크 조치를 실제로 실행하지 않습니다.",
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
          연결 확인 중에는 승인, 보류, 분쟁 처리를 실제 완료로 반영하지 않습니다.
        </div>
      ) : null}
      <div className="admin-trust-list">
        {items.map((item) => (
          <article className="admin-trust-card" key={item.incident.id}>
            <div>
              <span className={`risk-dot risk-dot--${item.risk.level}`} data-noninteractive="risk-level" />
              <div>
                <strong>{riskLabel(item.risk.level)} · {statusLabel(item.incident.status)}</strong>
                <p>{incidentReasonLabel(item.incident.reason)}</p>
              </div>
            </div>
            <dl>
              <div>
                <dt>요청</dt>
                <dd>{item.incident.pickupRequestId}</dd>
              </div>
              <div>
                <dt>위험 신호</dt>
                <dd>{riskSignalLabel(item.risk.signal)}</dd>
              </div>
              <div>
                <dt>보류</dt>
                <dd>{holdLabel(item.risk.holdPayment, item.risk.holdSettlement)}</dd>
              </div>
              <div>
                <dt>감사</dt>
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
      return "운영자가 증빙을 확인하고 수동 검토를 시작함"
    case "resolve":
      return "운영자가 증빙 확인 후 분쟁을 해결함"
    case "escalate":
      return "상위 운영 검토가 필요해 이관함"
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
      return "고위험"
    case "medium":
      return "중간 위험"
    case "low":
      return "낮은 위험"
    default:
      return assertNever(level)
  }
}

function incidentReasonLabel(value: string): string {
  const labels: Record<string, string> = {
    "Demo code mismatch review": "수령 코드 확인 필요",
    "Demo overdue storage watch": "장기 보관 확인",
    "pickup code mismatch after delegated pickup attempt": "대리 수령 시도 중 픽업 코드가 맞지 않음",
    "storage exceeds 24 hour operating policy": "24시간 보관 기준을 초과함",
  }
  return labels[value] ?? value
}

function riskSignalLabel(value: string): string {
  const labels: Record<string, string> = {
    "Demo package is past pickup window": "픽업 시간이 지나 보관 상태를 확인해야 합니다.",
    "Demo risk signal; no real hold is applied": "코드 재확인 안내가 필요하며 실제 보류는 적용되지 않았습니다.",
    "package stored past pickup window": "택배가 픽업 시간 이후에도 보관 중",
    "wrong code retry plus active friend authorization": "잘못된 코드 재시도와 활성 친구 권한이 함께 감지됨",
  }
  return labels[value] ?? value
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
