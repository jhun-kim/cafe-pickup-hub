import type { ApiDataSource, ApiHub, ApiPickupRequest } from "@/lib/api-contract"
import { loadPickupContracts } from "@/lib/api-client"
import type { CafePickupSpot, FlowStep } from "@/lib/uiux-data"
import { cafeSpots, flowSteps } from "@/lib/uiux-data"

export type ApiSourceView = {
  readonly source: ApiDataSource
  readonly label: string
  readonly detail: string
}

export type HomePickupData = {
  readonly spots: readonly CafePickupSpot[]
  readonly sourceView: ApiSourceView
  readonly mapSummary: string
}

export type PickupFlowData = {
  readonly steps: readonly FlowStep[]
  readonly sourceView: ApiSourceView
}

export async function getHomePickupData(): Promise<HomePickupData> {
  const contracts = await loadPickupContracts()
  const spots = contracts.data.hubs.map(toCafePickupSpot)
  const firstHub = contracts.data.hubs[0]

  return {
    spots: spots.length > 0 ? spots : cafeSpots,
    sourceView: toSourceView(contracts.source),
    mapSummary: firstHub ? `${firstHub.neighborhood} 주변 API 허브 ${contracts.data.hubs.length}곳` : "데모 허브 3곳",
  }
}

export async function getPickupFlowData(): Promise<PickupFlowData> {
  const contracts = await loadPickupContracts()
  const primaryHub = contracts.data.hubs[0]
  const pickupRequest = contracts.data.pickupRequests.find((request) => request.status === "ready_for_pickup") ?? contracts.data.pickupRequests[0]

  if (!primaryHub || !pickupRequest) {
    return {
      steps: flowSteps,
      sourceView: toSourceView(contracts.source),
    }
  }

  return {
    steps: toFlowSteps(primaryHub, pickupRequest),
    sourceView: toSourceView(contracts.source),
  }
}

function toCafePickupSpot(hub: ApiHub): CafePickupSpot {
  return {
    name: hub.cafeName,
    station: `${hub.neighborhood} · 도보 ${hub.walkMinutesFromStation}분`,
    distance: `${hub.walkMinutesFromStation * 80} m`,
    fee: formatKrw(hub.pricePerDayKrw),
    status: hub.availableSlots > 0 ? "영업 중" : "예약 대기",
    statusTone: hub.availableSlots > 0 ? "open" : "soon",
    slots: `${hub.availableSlots}칸 남음`,
    trust: hub.trustBadges[0] ?? "직원 확인",
  }
}

function toFlowSteps(hub: ApiHub, pickupRequest: ApiPickupRequest): readonly FlowStep[] {
  const firstSlot = hub.storageSlots[0]
  const authorization = pickupRequest.authorizations[0]

  return [
    {
      eyebrow: "STEP 1",
      title: "카페 선택",
      body: `${hub.neighborhood}의 ${hub.cafeName}에서 trust badge와 보관료를 확인합니다.`,
      action: `${hub.cafeName} 선택`,
      detailTitle: hub.cafeName,
      detailMeta: `${hub.walkMinutesFromStation}분 거리 · ${formatKrw(hub.pricePerDayKrw)} · ${hub.trustBadges[0] ?? "직원 확인"}`,
      iconIndex: 0,
      state: "진행",
    },
    {
      eyebrow: "STEP 2",
      title: "보관 슬롯 예약",
      body: "Phase 3 StorageSlot 계약 shape를 사용해 보관 위치와 물품 크기를 보여줍니다.",
      action: `${firstSlot?.label ?? "A102"} 예약`,
      detailTitle: firstSlot ? `${firstSlot.label} 슬롯` : "StorageSlot",
      detailMeta: `${pickupRequest.pickupWindow} · ${pickupRequest.package.sizeLabel}`,
      iconIndex: 2,
      state: "진행",
    },
    {
      eyebrow: "STEP 3",
      title: "입고 알림 확인",
      body: "Package 상태와 arrival note를 API contract에서 읽어 준비 상태를 표시합니다.",
      action: "도착 알림 보기",
      detailTitle: `Package ${pickupRequest.package.id}`,
      detailMeta: `${packageStatusLabel(pickupRequest.package.status)} · ${pickupRequest.package.arrivalNote}`,
      iconIndex: 1,
      state: pickupRequest.package.status === "received" ? "준비됨" : "대기",
    },
    {
      eyebrow: "STEP 4",
      title: "보안 픽업",
      body: "PickupRequest와 PickupAuthorization 상태를 기준으로 코드와 위임 가능 여부를 보여줍니다.",
      action: "친구에게 공유",
      detailTitle: `PickupRequest ${pickupRequest.id}`,
      detailMeta: `${pickupRequestStatusLabel(pickupRequest.status)} · ${authorization?.status ?? "no authorization"} · ${pickupRequest.pickupCode}`,
      iconIndex: 3,
      state: pickupRequest.status === "ready_for_pickup" ? "준비됨" : "진행",
    },
  ]
}

function toSourceView(source: ApiDataSource): ApiSourceView {
  switch (source.kind) {
    case "api":
      return {
        source,
        label: "API 상태: live v1",
        detail: source.apiBaseUrl,
      }
    case "demo":
      return {
        source,
        label: "API 상태: demo fallback",
        detail: `${source.apiBaseUrl} · ${source.reason}`,
      }
    default:
      return assertNever(source)
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

function pickupRequestStatusLabel(status: ApiPickupRequest["status"]): string {
  switch (status) {
    case "draft":
      return "작성 중"
    case "confirmed":
      return "예약 확정"
    case "ready_for_pickup":
      return "픽업 준비"
    case "completed":
      return "완료"
    case "canceled":
      return "취소"
    case "expired":
      return "만료"
    case "disputed":
      return "분쟁"
    case "payment_failed":
      return "결제 실패"
    default:
      return assertNever(status)
  }
}

function formatKrw(value: number): string {
  return `₩${value.toLocaleString("ko-KR")}`
}

function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${value}`)
}
