export type CafePickupSpot = {
  readonly id: string
  readonly name: string
  readonly station: string
  readonly distance: string
  readonly fee: string
  readonly status: string
  readonly statusTone: "open" | "soon"
  readonly slots: string
  readonly trust: string
}

export type FlowStep = {
  readonly title: string
  readonly eyebrow: string
  readonly body: string
  readonly action: string
  readonly detailTitle: string
  readonly detailMeta: string
  readonly iconIndex: 0 | 1 | 2 | 3 | 4 | 5
  readonly state: "진행" | "대기" | "준비됨"
}

export type PermissionOption = {
  readonly name: string
  readonly relation: string
  readonly selected: boolean
}

export type Metric = {
  readonly label: string
  readonly value: string
  readonly detail: string
  readonly iconIndex: 0 | 1 | 2 | 3 | 4 | 5
  readonly tone?: "accent" | "green"
}

export const cafeSpots = [
  {
    id: "hub-maple-counter",
    name: "브라운핸즈 역삼점",
    station: "역삼역 도보 3분",
    distance: "120 m",
    fee: "₩1,800",
    status: "영업 중",
    statusTone: "open",
    slots: "8칸 남음",
    trust: "직원 확인",
  },
  {
    id: "hub-river-locker",
    name: "모닝브루 선릉점",
    station: "선릉역 도보 5분",
    distance: "320 m",
    fee: "₩2,000",
    status: "영업 중",
    statusTone: "open",
    slots: "5칸 남음",
    trust: "CCTV 구역",
  },
  {
    id: "hub-garden-window",
    name: "커먼그라운드 논현",
    station: "논현역 도보 7분",
    distance: "540 m",
    fee: "₩2,200",
    status: "곧 오픈",
    statusTone: "soon",
    slots: "예약 알림",
    trust: "승인 대기",
  },
] as const satisfies readonly CafePickupSpot[]

export const flowSteps = [
  {
    eyebrow: "STEP 1",
    title: "카페 선택",
    body: "근처 안전 카페 픽업 허브를 거리, 보관료, 영업 상태와 직원 확인 배지로 비교합니다.",
    action: "브라운핸즈 선택",
    detailTitle: "브라운핸즈 역삼점",
    detailMeta: "120 m · ₩1,800 · 직원 확인",
    iconIndex: 0,
    state: "진행",
  },
  {
    eyebrow: "STEP 2",
    title: "보관 슬롯 예약",
    body: "받을 물품 크기, 보관 시간, 배송 메모를 넣어 보관함을 예약합니다.",
    action: "A102 예약",
    detailTitle: "A102 선반",
    detailMeta: "오늘 18:00까지 · 소형 택배",
    iconIndex: 2,
    state: "진행",
  },
  {
    eyebrow: "STEP 3",
    title: "입고 알림 확인",
    body: "카페 직원이 택배 도착을 확인하면 사진 메모와 준비 상태 알림을 받습니다.",
    action: "도착 알림 보기",
    detailTitle: "입고 완료",
    detailMeta: "직원 확인 · 13:12 도착",
    iconIndex: 1,
    state: "준비됨",
  },
  {
    eyebrow: "STEP 4",
    title: "보안 픽업",
    body: "일회용 코드나 대리 수령 권한을 제시하고 픽업을 완료합니다.",
    action: "친구에게 공유",
    detailTitle: "픽업 코드",
    detailMeta: "482 913 · 20:30 만료",
    iconIndex: 3,
    state: "준비됨",
  },
] as const satisfies readonly FlowStep[]

export const permissionOptions = [
  { name: "민지", relation: "친구", selected: true },
  { name: "도윤", relation: "동료", selected: false },
  { name: "하늘", relation: "가족", selected: false },
] as const satisfies readonly PermissionOption[]

export const hostMetrics = [
  { label: "오늘 보관 중인 택배", value: "32건", detail: "어제보다 8건 증가", iconIndex: 1, tone: "green" },
  { label: "보관함 사용률", value: "76%", detail: "38 / 50칸 사용 중", iconIndex: 2, tone: "green" },
  { label: "예정된 픽업", value: "15건", detail: "오후 7건 / 저녁 8건", iconIndex: 3 },
  { label: "이번 달 수익", value: "₩1,250,000", detail: "수수료 포함 예상", iconIndex: 5, tone: "accent" },
  { label: "정산 가능 금액", value: "₩320,000", detail: "정산 신청 가능", iconIndex: 5, tone: "accent" },
] as const satisfies readonly Metric[]

export const adminMetrics = [
  { label: "활성 픽업 카페", value: "128", detail: "이번 주 +14", iconIndex: 0, tone: "green" },
  { label: "검증 대기", value: "23", detail: "평균 2.4시간", iconIndex: 3 },
  { label: "분쟁/문의", value: "7", detail: "긴급 2건", iconIndex: 4, tone: "accent" },
  { label: "연체 보관", value: "41", detail: "24시간 초과", iconIndex: 1, tone: "accent" },
] as const satisfies readonly Metric[]
