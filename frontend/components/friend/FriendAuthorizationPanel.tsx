"use client"

import type { ApiPickupAuthorization, ApiPickupRequest } from "@/lib/api-contract"
import {
  parsePickupAuthorizationCreateResponse,
  parsePickupAuthorizationResponse,
} from "@/lib/pickup-authorizations-parser"
import type { FormEvent } from "react"
import { useState } from "react"

type FriendAuthorizationPanelProps = {
  readonly apiSourceKind: "api" | "demo"
  readonly pickupRequest: ApiPickupRequest | null
  readonly initialAuthorizations: readonly ApiPickupAuthorization[]
}

type ActionState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading"; readonly label: string }
  | { readonly kind: "created"; readonly authorizationId: string; readonly oneTimeCode: string }
  | { readonly kind: "updated"; readonly authorizationId: string; readonly status: ApiPickupAuthorization["status"] }
  | { readonly kind: "error"; readonly message: string }

export function FriendAuthorizationPanel({
  apiSourceKind,
  pickupRequest,
  initialAuthorizations,
}: FriendAuthorizationPanelProps) {
  const [authorizations, setAuthorizations] = useState<readonly ApiPickupAuthorization[]>(initialAuthorizations)
  const [selectedAuthorizationId, setSelectedAuthorizationId] = useState<string | null>(null)
  const [actionState, setActionState] = useState<ActionState>({ kind: "idle" })
  const isApiBacked = apiSourceKind === "api" && pickupRequest !== null
  const selectedAuthorization =
    authorizations.find((item) => item.id === selectedAuthorizationId) ??
    authorizations.find((item) => item.status === "active") ??
    authorizations[0] ??
    null

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!isApiBacked || pickupRequest === null) {
      setActionState({ kind: "error", message: "연결 확인 중에는 친구 권한을 실제로 만들지 않습니다." })
      return
    }
    const formData = new FormData(event.currentTarget)
    const response = await postJson("/api/pickup-authorizations", {
      pickup_request_id: pickupRequest.id,
      authorized_picker_name: readFormValue(formData, "authorized_picker_name"),
      expires_at: readFormValue(formData, "expires_at"),
    }, "권한 생성 중")
    if (response === null) {
      return
    }
    const created = parsePickupAuthorizationCreateResponse(response)
    setAuthorizations((current) => [created, ...current])
    setSelectedAuthorizationId(created.id)
    setActionState({ kind: "created", authorizationId: created.id, oneTimeCode: created.oneTimeCode })
  }

  async function handleRevoke(authorization: ApiPickupAuthorization): Promise<void> {
    if (!isApiBacked) {
      setActionState({ kind: "error", message: "연결 확인 중에는 권한 취소를 실제로 실행하지 않습니다." })
      return
    }
    const response = await postJson(`/api/pickup-authorizations/${authorization.id}/revoke`, {}, "권한 취소 중")
    if (response === null) {
      return
    }
    updateAuthorization(parsePickupAuthorizationResponse(response))
  }

  async function handleConsume(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!isApiBacked || selectedAuthorization === null) {
      setActionState({ kind: "error", message: "사용 가능한 실시간 권한이 없습니다." })
      return
    }
    const formData = new FormData(event.currentTarget)
    const response = await postJson(
      `/api/pickup-authorizations/${selectedAuthorization.id}/consume`,
      { one_time_code: readFormValue(formData, "one_time_code") },
      "코드 확인 중",
    )
    if (response === null) {
      return
    }
    updateAuthorization(parsePickupAuthorizationResponse(response))
  }

  async function postJson(path: string, body: Record<string, string>, label: string): Promise<unknown | null> {
    try {
      setActionState({ kind: "loading", label })
      const response = await fetch(path, {
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
      const payload: unknown = await response.json()
      if (!response.ok) {
        setActionState({ kind: "error", message: readDetail(payload) ?? `${label} 실패: HTTP ${response.status}` })
        return null
      }
      return payload
    } catch (error) {
      if (error instanceof Error) {
        setActionState({ kind: "error", message: `${label} 실패: ${error.message}` })
        return null
      }
      throw error
    }
  }

  function updateAuthorization(updated: ApiPickupAuthorization): void {
    setAuthorizations((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    setSelectedAuthorizationId(updated.id)
    setActionState({ kind: "updated", authorizationId: updated.id, status: updated.status })
  }

  return (
    <section className="permission-card" data-auth-mode={apiSourceKind}>
      {!isApiBacked ? (
        <div className="permission-warning" data-noninteractive="demo-blocked" role="status">
          연결 확인 중에는 친구 권한을 실제로 변경하지 않습니다.
        </div>
      ) : null}

      <form className="permission-form" onSubmit={handleCreate}>
        <label>
          픽업할 친구
          <input name="authorized_picker_name" defaultValue="민지" disabled={!isApiBacked || actionState.kind === "loading"} />
        </label>
        <label>
          만료 시간
          <input name="expires_at" defaultValue="2026-06-14T20:30:00+09:00" disabled={!isApiBacked || actionState.kind === "loading"} />
        </label>
        <button className="primary-button primary-button--full" type="submit" disabled={!isApiBacked || actionState.kind === "loading"}>
          {actionState.kind === "loading" ? actionState.label : "권한 공유하기"}
        </button>
      </form>

      <div className="code-panel" data-noninteractive="verification-preview">
        <strong>{selectedAuthorization?.codeHint ?? "권한 없음"}</strong>
        <span>QR + PIN + 1회 코드 · 사용 즉시 만료</span>
        <span>{selectedAuthorization ? statusLabel(selectedAuthorization.status) : "생성 대기"}</span>
      </div>

      <form className="permission-form permission-form--inline" onSubmit={handleConsume}>
        <label className="permission-code-label">
          1회 코드
          <input name="one_time_code" placeholder="예: 482913" disabled={!isApiBacked || actionState.kind === "loading"} />
        </label>
        <button className="ghost-button" type="submit" disabled={!isApiBacked || actionState.kind === "loading" || selectedAuthorization === null}>
          코드 사용
        </button>
      </form>
      <button
        className="ghost-button ghost-button--danger"
        type="button"
        disabled={!isApiBacked || actionState.kind === "loading" || selectedAuthorization === null}
        onClick={() => {
          if (selectedAuthorization) {
            void handleRevoke(selectedAuthorization)
          }
        }}
      >
        권한 취소
      </button>

      {actionState.kind === "created" ? (
        <div className="permission-result" data-auth-result="created" role="status" aria-live="polite">
          <strong>1회 코드 생성</strong>
          <span>권한번호 {actionState.authorizationId}</span>
          <span>1회 코드 {actionState.oneTimeCode}</span>
        </div>
      ) : null}
      {actionState.kind === "updated" ? (
        <div className="permission-result" data-auth-result={actionState.status} role="status" aria-live="polite">
          {actionState.authorizationId} · {statusLabel(actionState.status)}
        </div>
      ) : null}
      {actionState.kind === "error" ? (
        <div className="permission-error" data-auth-result="error" role="alert">
          {actionState.message}
        </div>
      ) : null}
    </section>
  )
}

function readFormValue(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
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

function statusLabel(status: ApiPickupAuthorization["status"]): string {
  switch (status) {
    case "active":
      return "활성"
    case "used":
      return "사용됨"
    case "expired":
      return "만료"
    case "revoked":
      return "취소됨"
    default:
      return assertNever(status)
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled status: ${value}`)
}
