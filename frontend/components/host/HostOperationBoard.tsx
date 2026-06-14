"use client"

import type { ApiHostOperationAction, ApiHostOperationItem, ApiPickupRequest } from "@/lib/api-contract"
import { parseHostOperationResponse } from "@/lib/host-operations-parser"
import { useState } from "react"

type HostOperationBoardProps = {
  readonly apiSourceKind: "api" | "demo"
  readonly initialOperations: readonly ApiHostOperationItem[]
}

type ActionState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading"; readonly requestId: string }
  | { readonly kind: "success"; readonly requestId: string; readonly label: string }
  | { readonly kind: "error"; readonly requestId: string; readonly message: string }

export function HostOperationBoard({ apiSourceKind, initialOperations }: HostOperationBoardProps) {
  const [operations, setOperations] = useState<readonly ApiHostOperationItem[]>(initialOperations)
  const [actionState, setActionState] = useState<ActionState>({ kind: "idle" })
  const isApiBacked = apiSourceKind === "api"

  async function submitAction(operation: ApiHostOperationItem): Promise<void> {
    if (!isApiBacked) {
      setActionState({
        kind: "error",
        requestId: operation.pickupRequest.id,
        message: "Demo fallback 상태에서는 실제 호스트 처리를 실행하지 않습니다.",
      })
      return
    }

    try {
      setActionState({ kind: "loading", requestId: operation.pickupRequest.id })
      const response = await fetch(`/api/host-operations/${operation.pickupRequest.id}/actions`, {
        body: JSON.stringify(toActionPayload(operation)),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
      const payload: unknown = await response.json()

      if (!response.ok) {
        setActionState({
          kind: "error",
          requestId: operation.pickupRequest.id,
          message: readDetail(payload) ?? `호스트 작업 실패: HTTP ${response.status}`,
        })
        return
      }

      const updated = parseHostOperationResponse(payload)

      setOperations((current) => current.map((item) => (item.pickupRequest.id === updated.pickupRequest.id ? updated : item)))
      setActionState({ kind: "success", requestId: updated.pickupRequest.id, label: updated.operation.label })
    } catch (error) {
      if (error instanceof Error) {
        setActionState({ kind: "error", requestId: operation.pickupRequest.id, message: `호스트 작업 실패: ${error.message}` })
        return
      }
      throw error
    }
  }

  return (
    <section className="host-ops-panel" data-host-ops-mode={apiSourceKind}>
      {!isApiBacked ? (
        <div className="host-ops-warning" data-noninteractive="demo-host-action-blocked">
          Demo fallback 데이터입니다. 입고, 보관함 배정, 픽업 완료는 실제 성공처럼 처리하지 않습니다.
        </div>
      ) : null}
      <div className="host-ops-list">
        {operations.map((operation) => (
          <article className="host-op-card" key={operation.pickupRequest.id}>
            <div>
              <span className="eyebrow">{operation.hub.cafeName}</span>
              <h3>{operation.operation.label}</h3>
              <p>{operation.operation.safetyNote}</p>
            </div>
            <dl>
              <div>
                <dt>요청</dt>
                <dd>{operation.pickupRequest.id}</dd>
              </div>
              <div>
                <dt>상태</dt>
                <dd>{requestStatusLabel(operation.pickupRequest.status)}</dd>
              </div>
              <div>
                <dt>패키지</dt>
                <dd>{packageStatusLabel(operation.pickupRequest.package.status)}</dd>
              </div>
              <div>
                <dt>보관함</dt>
                <dd>{operation.pickupRequest.package.storageSlotId}</dd>
              </div>
            </dl>
            <button
              className="primary-button"
              type="button"
              disabled={!isApiBacked || isLoading(actionState, operation.pickupRequest.id)}
              onClick={() => {
                void submitAction(operation)
              }}
            >
              {isLoading(actionState, operation.pickupRequest.id) ? "처리 중" : actionLabel(operation.operation.action)}
            </button>
            {actionState.kind === "success" && actionState.requestId === operation.pickupRequest.id ? (
              <p className="host-ops-success" data-host-action-result="success">
                {actionState.label} 처리 완료
              </p>
            ) : null}
            {actionState.kind === "error" && actionState.requestId === operation.pickupRequest.id ? (
              <p className="host-ops-error" data-host-action-result="error">
                {actionState.message}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

function toActionPayload(operation: ApiHostOperationItem): Record<string, string> {
  const base = {
    action: operation.operation.action,
    note: defaultNote(operation.operation.action),
  }
  switch (operation.operation.action) {
    case "receive_package":
    case "assign_storage":
      return { ...base, storage_slot_id: operation.pickupRequest.package.storageSlotId }
    case "complete_handoff":
      return { ...base, pickup_code: operation.pickupRequest.pickupCode }
    default:
      return assertNever(operation.operation.action)
  }
}

function defaultNote(action: ApiHostOperationAction): string {
  switch (action) {
    case "receive_package":
      return "Host received package and checked exterior condition"
    case "assign_storage":
      return "Host assigned package to the visible storage slot"
    case "complete_handoff":
      return "Host verified pickup code and completed handoff"
    default:
      return assertNever(action)
  }
}

function isLoading(state: ActionState, requestId: string): boolean {
  return state.kind === "loading" && state.requestId === requestId
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

function actionLabel(action: ApiHostOperationAction): string {
  switch (action) {
    case "receive_package":
      return "입고 등록"
    case "assign_storage":
      return "보관함 배정"
    case "complete_handoff":
      return "픽업 완료"
    default:
      return assertNever(action)
  }
}

function packageStatusLabel(status: ApiPickupRequest["package"]["status"]): string {
  switch (status) {
    case "expected":
      return "입고 예정"
    case "received":
      return "입고 완료"
    case "picked_up":
      return "픽업 완료"
    case "not_received":
      return "미입고"
    case "disputed":
      return "분쟁"
    default:
      return assertNever(status)
  }
}

function requestStatusLabel(status: ApiPickupRequest["status"]): string {
  switch (status) {
    case "confirmed":
      return "예약 확정"
    case "ready_for_pickup":
      return "픽업 준비"
    case "completed":
      return "완료"
    case "draft":
    case "canceled":
    case "expired":
    case "disputed":
    case "payment_failed":
      return "비활성"
    default:
      return assertNever(status)
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${value}`)
}
