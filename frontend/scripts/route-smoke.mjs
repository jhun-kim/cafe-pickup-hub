const baseUrl = process.env.ROUTE_SMOKE_BASE_URL ?? "http://127.0.0.1:3002"

const checks = [
  {
    path: "/",
    markers: [
      "오늘 받을 택배, 가까운 카페에 안전하게",
      "data-api-source=",
      "href=\"/pickup-flow\"",
      "data-noninteractive=\"home-alert-preview\"",
      "data-noninteractive=\"home-location-preview\"",
      "data-noninteractive=\"home-search-preview\"",
    ],
  },
  {
    path: "/pickup-flow",
    markers: [
      "지금 할 일만 크게, 엄지손가락으로 예약까지.",
      "data-api-source=",
      "픽업 예약 시작",
      "id=\"pickup-booking\"",
      "href=\"#pickup-booking\"",
      "href=\"/friend-permission\"",
    ],
  },
  {
    path: "/friend-permission",
    markers: ["일회용 코드", "권한 취소", "사용 즉시 만료", "data-api-source=", "data-auth-mode="],
  },
  {
    path: "/host",
    markers: ["오늘 우선 작업", "호스트 운영 작업", "data-api-source=", "data-host-ops-mode="],
  },
  {
    path: "/admin",
    markers: ["data-api-source=", "data-admin-trust-mode=", "분쟁 / 리스크 판단", "감사 기록"],
  },
]

for (const check of checks) {
  const response = await fetch(`${baseUrl}${check.path}`)

  if (!response.ok) {
    throw new Error(`${check.path} returned ${response.status}`)
  }

  const html = await response.text()
  const missing = check.markers.filter((marker) => !html.includes(marker))

  if (missing.length > 0) {
    throw new Error(`${check.path} missing markers: ${missing.join(", ")}`)
  }

  console.log(`${check.path} ok`)
}
