"use client"

import type { FormEvent } from "react"
import { useState } from "react"

type BookingFormProps = {
  readonly apiSourceKind: "api" | "demo"
  readonly hubId: string
  readonly hubName: string
  readonly priceLabel: string
}

type CreateState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading" }
  | { readonly kind: "success"; readonly requestId: string; readonly status: string }
  | { readonly kind: "error"; readonly message: string }

export function BookingForm({ apiSourceKind, hubId, hubName, priceLabel }: BookingFormProps) {
  const [createState, setCreateState] = useState<CreateState>({ kind: "idle" })
  const isApiBacked = apiSourceKind === "api"

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!isApiBacked) {
      setCreateState({ kind: "error", message: "Demo fallback 상태에서는 실제 예약을 생성하지 않습니다." })
      return
    }

    try {
      setCreateState({ kind: "loading" })
      const formData = new FormData(event.currentTarget)
      const response = await fetch("/api/pickup-requests", {
        body: JSON.stringify({
          hub_id: readFormValue(formData, "hub_id"),
          user_id: readFormValue(formData, "user_id"),
          package_size: readFormValue(formData, "package_size"),
          pickup_window: readFormValue(formData, "pickup_window"),
          delivery_note: readFormValue(formData, "delivery_note"),
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })

      const payload: unknown = await response.json()

      if (!response.ok) {
        setCreateState({ kind: "error", message: readDetail(payload) ?? `예약 생성 실패: HTTP ${response.status}` })
        return
      }

      const created = readCreatedPayload(payload)
      if (!created) {
        setCreateState({ kind: "error", message: "예약 응답을 해석할 수 없습니다." })
        return
      }

      setCreateState({ kind: "success", requestId: created.id, status: created.status })
    } catch (error) {
      if (error instanceof Error) {
        setCreateState({ kind: "error", message: `예약 생성 실패: ${error.message}` })
        return
      }
      throw error
    }
  }

  return (
    <section className="booking-panel" data-booking-mode={apiSourceKind}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Create pickup request</p>
          <h2>픽업 예약 시작</h2>
          <p>
            {hubName} · {priceLabel}
          </p>
        </div>
      </div>

      {!isApiBacked ? (
        <div className="booking-warning" data-noninteractive="demo-create-blocked">
          Demo fallback 데이터입니다. 실제 예약 성공처럼 처리하지 않으며 backend 연결 후 생성할 수 있습니다.
        </div>
      ) : null}

      <form className="booking-form" onSubmit={handleSubmit}>
        <input name="hub_id" type="hidden" value={hubId} />
        <input name="user_id" type="hidden" value="user-jieun" />
        <label>
          물품 크기
          <select name="package_size" defaultValue="small parcel" disabled={!isApiBacked || createState.kind === "loading"}>
            <option value="small parcel">소형 택배</option>
            <option value="medium tote">중형 쇼퍼백</option>
            <option value="document envelope">서류 봉투</option>
          </select>
        </label>
        <label>
          픽업 시간
          <input name="pickup_window" defaultValue="2026-06-14 18:00-20:30" disabled={!isApiBacked || createState.kind === "loading"} />
        </label>
        <label>
          배송 메모
          <textarea
            name="delivery_note"
            defaultValue="카페 직원에게만 맡겨주세요."
            disabled={!isApiBacked || createState.kind === "loading"}
          />
        </label>
        <button className="primary-button primary-button--full" type="submit" disabled={!isApiBacked || createState.kind === "loading"}>
          {createState.kind === "loading" ? "예약 생성 중" : "픽업 예약 만들기"}
        </button>
      </form>

      {createState.kind === "success" ? (
        <div className="booking-confirmation" data-create-result="success">
          <strong>예약 생성 완료</strong>
          <span>{createState.requestId}</span>
          <span>{createState.status}</span>
        </div>
      ) : null}
      {createState.kind === "error" ? (
        <div className="booking-error" data-create-result="error">
          {createState.message}
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

function readCreatedPayload(payload: unknown): { readonly id: string; readonly status: string } | null {
  if (!isRecord(payload)) {
    return null
  }
  const id = payload["id"]
  const status = payload["status"]
  return typeof id === "string" && typeof status === "string" ? { id, status } : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
