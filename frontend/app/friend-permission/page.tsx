import Link from "next/link"

import { FriendAuthorizationPanel } from "@/components/friend/FriendAuthorizationPanel"
import { IconMotif } from "@/components/uiux/IconMotif"
import { MobileShell } from "@/components/uiux/MobileShell"
import { StatusPill } from "@/components/uiux/StatusPill"
import type { ApiPickupAuthorization, ApiPickupRequest } from "@/lib/api-contract"
import { loadFriendAuthorizationsFromSameOrigin } from "@/lib/friend-authorization-route-data"
import { permissionOptions } from "@/lib/uiux-data"

export default async function FriendPermissionPage() {
  const friendData = await loadFriendAuthorizationsFromSameOrigin()
  const pickupRequest = friendData.data.pickupRequest
  const activeAuthorization = friendData.data.authorizations.find((item) => item.status === "active")

  return (
    <MobileShell active="friend">
      <header className="mobile-header">
        <div>
          <h1>친구에게 픽업 권한 공유</h1>
          <p>일회용 코드, 만료 시간, 취소와 사용 상태를 live API 기준으로 관리하세요.</p>
        </div>
      </header>

      <section className="source-banner" data-api-source={friendData.source.kind}>
        <strong>{friendData.source.kind === "api" ? "API 상태: live v1" : "API 상태: demo fallback"}</strong>
        <span>{friendData.source.apiBaseUrl}</span>
        {friendData.source.kind === "demo" ? <span>실제 친구 권한 성공으로 표시하지 않습니다.</span> : null}
      </section>

      <section className="detail-card" data-noninteractive="package-summary">
        <div className="detail-card__icon">
          <IconMotif index={1} label="택배" size="lg" />
        </div>
        <div>
          <StatusPill tone={pickupRequest?.status === "ready_for_pickup" ? "green" : "coral"}>
            {pickupRequest ? requestStatusLabel(pickupRequest.status) : "권한 대기"}
          </StatusPill>
          <h2>{pickupRequest ? `${pickupRequest.package.sizeLabel} · ${pickupRequest.package.storageSlotId}` : "픽업 요청 없음"}</h2>
          <p>{pickupRequest ? `${pickupRequest.pickupWindow} · ${pickupRequest.package.arrivalNote}` : "backend 연결 후 권한을 만들 수 있습니다."}</p>
        </div>
      </section>

      <section className="permission-state-grid" aria-label="위임 권한 상태">
        <div data-noninteractive="permission-state">
          <span>권한 상태</span>
          <strong>{activeAuthorization ? authorizationStatusLabel(activeAuthorization.status) : "대기"}</strong>
        </div>
        <div data-noninteractive="permission-state">
          <span>만료</span>
          <strong>{activeAuthorization?.expiresAt ?? "미정"}</strong>
        </div>
        <div data-noninteractive="permission-state">
          <span>재사용</span>
          <strong>불가</strong>
        </div>
      </section>

      <section className="mobile-section">
        <div className="section-row">
          <h2>픽업할 친구 선택</h2>
          <Link href="/">추가</Link>
        </div>
        <div className="friend-list">
          {permissionOptions.map((option) => (
            <button
              key={option.name}
              className={option.selected ? "friend-option is-selected" : "friend-option"}
              type="button"
              data-noninteractive="friend-template"
            >
              <IconMotif index={4} label="" size="sm" />
              <span>
                <strong>{option.name}</strong>
                {option.relation}
              </span>
            </button>
          ))}
        </div>
      </section>

      <FriendAuthorizationPanel
        apiSourceKind={friendData.source.kind}
        pickupRequest={pickupRequest}
        initialAuthorizations={friendData.data.authorizations}
      />
    </MobileShell>
  )
}

function requestStatusLabel(status: ApiPickupRequest["status"]): string {
  switch (status) {
    case "ready_for_pickup":
      return "픽업 준비"
    case "confirmed":
      return "예약 확정"
    case "completed":
      return "완료"
    case "draft":
    case "canceled":
    case "expired":
    case "disputed":
    case "payment_failed":
      return "권한 불가"
    default:
      return assertNever(status)
  }
}

function authorizationStatusLabel(status: ApiPickupAuthorization["status"]): string {
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
  throw new Error(`Unhandled variant: ${value}`)
}
