import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()

const sourceChecks = [
  {
    file: "app/admin/page.tsx",
    required: ["감사 기록", "수령 코드 확인 필요", "장기 보관 확인", "연결 확인용 기록"],
    forbidden: ["Audit log", "데모 코드 불일치 검토", "데모 장기 보관 확인", "데모 검토 생성", "데모 보류 기록"],
  },
  {
    file: "components/admin/AdminTrustBoard.tsx",
    required: ["연결 확인 중에는 리스크 조치를 실제로 실행하지 않습니다", "수령 코드 확인 필요", "장기 보관 확인"],
    forbidden: ["데모 코드 불일치 검토", "데모 장기 보관 확인", "데모 위험 신호", "실제 리스크 조치"],
  },
  {
    file: "components/host/HostOperationBoard.tsx",
    required: ["연결 확인 중에는 입고, 보관함 배정, 픽업 완료를 실제로 반영하지 않습니다"],
    forbidden: ["데모 상태에서는 실제 호스트 처리를 실행하지 않습니다", "데모 데이터입니다"],
  },
  {
    file: "components/friend/FriendAuthorizationPanel.tsx",
    required: ["연결 확인 중에는 친구 권한을 실제로 변경하지 않습니다"],
    forbidden: ["데모 데이터입니다"],
  },
  {
    file: "components/pickup/BookingForm.tsx",
    required: ["연결 확인 중에는 예약을 실제로 생성하지 않습니다"],
    forbidden: ["데모 데이터입니다"],
  },
]

for (const check of sourceChecks) {
  const source = readFileSync(join(root, check.file), "utf8")
  const missing = check.required.filter((marker) => !source.includes(marker))
  if (missing.length > 0) {
    throw new Error(`${check.file} missing polish markers: ${missing.join(", ")}`)
  }

  const present = check.forbidden.filter((marker) => source.includes(marker))
  if (present.length > 0) {
    throw new Error(`${check.file} still has technical/demo copy: ${present.join(", ")}`)
  }
}

const routeSmoke = readFileSync(join(root, "scripts/route-smoke.mjs"), "utf8")
if (!routeSmoke.includes("감사 기록") || routeSmoke.includes("Audit log")) {
  throw new Error("route smoke must assert Korean admin audit copy and forbid stale English marker")
}

console.log("ui polish contract ok")
