const baseUrl = process.env.ROUTE_SMOKE_BASE_URL ?? "http://127.0.0.1:3002"

const checks = [
  {
    path: "/",
    markers: ["근처 안전 카페 픽업 허브", "API 상태", "data-api-source=", "href=\"/pickup-flow\""],
  },
  {
    path: "/pickup-flow",
    markers: ["Hub 발견부터 보안 픽업까지", "API 상태", "data-api-source=", "픽업 예약 시작", "href=\"/friend-permission\""],
  },
  {
    path: "/friend-permission",
    markers: ["일회용 코드", "권한 취소", "사용 즉시 만료"],
  },
  {
    path: "/host",
    markers: ["오늘 우선 작업", "호스트 운영 작업", "data-api-source=", "data-host-ops-mode="],
  },
  {
    path: "/admin",
    markers: ["승인 판단", "Risk hold", "분쟁 처리"],
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
