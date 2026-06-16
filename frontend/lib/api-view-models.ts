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

export type BookingHubView = {
  readonly id: string
  readonly name: string
  readonly priceLabel: string
}

export type PickupFlowData = {
  readonly steps: readonly FlowStep[]
  readonly sourceView: ApiSourceView
  readonly selectedHub: BookingHubView
}

export async function getHomePickupData(): Promise<HomePickupData> {
  const contracts = await loadPickupContracts()
  const spots = contracts.data.hubs.map(toCafePickupSpot)
  const firstHub = contracts.data.hubs[0]

  return {
    spots: spots.length > 0 ? spots : cafeSpots,
    sourceView: toSourceView(contracts.source),
    mapSummary: firstHub ? `${translateNeighborhood(firstHub.neighborhood)} 주변 카페 ${contracts.data.hubs.length}곳` : "데모 카페 3곳",
  }
}

export async function getPickupFlowData(selectedHubId: string | undefined): Promise<PickupFlowData> {
  const contracts = await loadPickupContracts()
  const primaryHub = contracts.data.hubs.find((hub) => hub.id === selectedHubId) ?? contracts.data.hubs[0]
  const pickupRequest = contracts.data.pickupRequests.find((request) => request.status === "ready_for_pickup") ?? contracts.data.pickupRequests[0]

  if (!primaryHub || !pickupRequest) {
    return {
      steps: flowSteps,
      sourceView: toSourceView(contracts.source),
      selectedHub: {
        id: "demo-hub-1",
        name: cafeSpots[0]?.name ?? "데모 카페",
        priceLabel: cafeSpots[0]?.fee ?? "₩1,800",
      },
    }
  }

  return {
    steps: toFlowSteps(primaryHub, pickupRequest),
    sourceView: toSourceView(contracts.source),
    selectedHub: {
      id: primaryHub.id,
      name: translateCafeName(primaryHub.cafeName),
      priceLabel: formatKrw(primaryHub.pricePerDayKrw),
    },
  }
}

function toCafePickupSpot(hub: ApiHub): CafePickupSpot {
  return {
    id: hub.id,
    name: translateCafeName(hub.cafeName),
    station: `${translateNeighborhood(hub.neighborhood)} · 도보 ${hub.walkMinutesFromStation}분`,
    distance: `${hub.walkMinutesFromStation * 80} m`,
    fee: formatKrw(hub.pricePerDayKrw),
    status: hub.availableSlots > 0 ? "영업 중" : "예약 대기",
    statusTone: hub.availableSlots > 0 ? "open" : "soon",
    slots: `${hub.availableSlots}칸 남음`,
    trust: translateTrustBadge(hub.trustBadges[0]),
  }
}

function toFlowSteps(hub: ApiHub, pickupRequest: ApiPickupRequest): readonly FlowStep[] {
  const firstSlot = hub.storageSlots[0]
  const authorization = pickupRequest.authorizations[0]

  return [
    {
      eyebrow: "STEP 1",
      title: "카페 선택",
      body: `${translateNeighborhood(hub.neighborhood)}의 ${translateCafeName(hub.cafeName)}에서 안전 배지와 보관료를 확인합니다.`,
      action: `${translateCafeName(hub.cafeName)} 선택`,
      detailTitle: translateCafeName(hub.cafeName),
      detailMeta: `${hub.walkMinutesFromStation}분 거리 · ${formatKrw(hub.pricePerDayKrw)} · ${translateTrustBadge(hub.trustBadges[0])}`,
      iconIndex: 0,
      state: "진행",
    },
    {
      eyebrow: "STEP 2",
      title: "보관 슬롯 예약",
      body: "보관 위치와 물품 크기를 큰 글씨로 보여줘 바로 확인할 수 있습니다.",
      action: `${firstSlot?.label ?? "A102"} 예약`,
      detailTitle: firstSlot ? `${firstSlot.label} 보관함` : "보관함",
      detailMeta: `${pickupRequest.pickupWindow} · ${translatePackageSize(pickupRequest.package.sizeLabel)}`,
      iconIndex: 2,
      state: "진행",
    },
    {
      eyebrow: "STEP 3",
      title: "입고 알림 확인",
      body: "택배가 도착하면 직원 확인 메모와 준비 상태를 바로 보여줍니다.",
      action: "도착 알림 보기",
      detailTitle: `택배 ${pickupRequest.package.id}`,
      detailMeta: `${packageStatusLabel(pickupRequest.package.status)} · ${translateArrivalNote(pickupRequest.package.arrivalNote)}`,
      iconIndex: 1,
      state: pickupRequest.package.status === "received" ? "준비됨" : "대기",
    },
    {
      eyebrow: "STEP 4",
      title: "보안 픽업",
      body: "픽업 코드와 친구 위임 가능 여부를 한 화면에서 확인합니다.",
      action: "친구에게 공유",
      detailTitle: `픽업 요청 ${pickupRequest.id}`,
      detailMeta: `${pickupRequestStatusLabel(pickupRequest.status)} · ${authorizationStatusLabel(authorization?.status)} · ${pickupRequest.pickupCode}`,
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
        label: "서버 연결됨",
        detail: source.apiBaseUrl,
      }
    case "demo":
      return {
        source,
        label: "데모 데이터 표시 중",
        detail: translateDemoReason(source.reason),
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

function translateCafeName(value: string): string {
  const names: Record<string, string> = {
    "Garden Window Roasters": "가든윈도우 로스터스",
    "Maple Counter Cafe": "메이플카운터 카페",
    "River Locker Espresso": "리버라커 에스프레소",
  }
  return names[value] ?? value
}

function translateNeighborhood(value: string): string {
  const neighborhoods: Record<string, string> = {
    Hapjeong: "합정",
    Seongsu: "성수",
    Yeonnam: "연남",
  }
  return neighborhoods[value] ?? value
}

function translateTrustBadge(value: string | undefined): string {
  const badges: Record<string, string> = {
    "CCTV entrance": "입구 CCTV",
    "dry storage": "건조 보관",
    "late pickup": "늦은 픽업 가능",
    "numbered cubbies": "번호 보관함",
    "photo receipt": "사진 입고 확인",
    "quiet pickup zone": "조용한 수령 구역",
    "sealed shelf": "밀봉 선반",
    "staff handoff": "직원 직접 전달",
    "staff verified": "직원 확인 완료",
  }
  return value ? badges[value] ?? value : "직원 확인"
}

function translatePackageSize(value: string): string {
  const sizes: Record<string, string> = {
    "document envelope": "서류 봉투",
    "medium tote": "중형 쇼퍼백",
    "small parcel": "소형 택배",
  }
  return sizes[value] ?? value
}

function translateArrivalNote(value: string): string {
  const notes: Record<string, string> = {
    "courier expected after 15:00": "15시 이후 배송 예정",
    "photo receipt recorded": "사진 입고 확인 완료",
  }
  return notes[value] ?? value
}

function authorizationStatusLabel(status: string | undefined): string {
  const labels: Record<string, string> = {
    active: "위임 가능",
    expired: "만료됨",
    revoked: "취소됨",
    used: "사용 완료",
  }
  return status ? labels[status] ?? status : "위임 없음"
}

function translateDemoReason(value: string): string {
  const lower = value.toLowerCase()
  if (lower.includes("failed to fetch") || lower.includes("fetch failed")) {
    return "서버 응답이 없어 데모로 전환됨"
  }
  if (lower.includes("parse")) {
    return "서버 응답 형식 확인 필요"
  }
  return value
}

function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${value}`)
}
