import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const requiredFiles = [
  "lib/api-contract.ts",
  "lib/api-client.ts",
  "lib/api-view-models.ts",
  "components/pickup/BookingForm.tsx",
  "app/api/pickup-requests/route.ts",
  "components/host/HostOperationBoard.tsx",
  "app/api/host-operations/[pickupRequestId]/actions/route.ts",
  "components/friend/FriendAuthorizationPanel.tsx",
  "app/api/pickup-authorizations/route.ts",
  "app/api/pickup-authorizations/[authorizationId]/revoke/route.ts",
  "app/api/pickup-authorizations/[authorizationId]/consume/route.ts",
  "components/admin/AdminTrustBoard.tsx",
  "app/api/admin-trust/route.ts",
  "app/api/admin-trust/incidents/[incidentId]/actions/route.ts",
]

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    throw new Error(`missing API contract file: ${file}`)
  }
}

const sourceChecks = [
  {
    file: "app/page.tsx",
    markers: ["getHomePickupData", "data-api-source"],
  },
  {
    file: "app/pickup-flow/page.tsx",
    markers: ["getPickupFlowData", "data-api-source", "BookingForm"],
  },
  {
    file: "app/host/page.tsx",
    markers: ["loadHostOperations", "data-api-source", "HostOperationBoard"],
  },
  {
    file: "app/friend-permission/page.tsx",
    markers: ["loadFriendAuthorizationsFromSameOrigin", "data-api-source", "FriendAuthorizationPanel"],
  },
  {
    file: "app/admin/page.tsx",
    markers: ["loadAdminTrustFromSameOrigin", "data-api-source", "AdminTrustBoard"],
  },
]

for (const check of sourceChecks) {
  const source = readFileSync(join(root, check.file), "utf8")
  const missing = check.markers.filter((marker) => !source.includes(marker))

  if (missing.length > 0) {
    throw new Error(`${check.file} missing markers: ${missing.join(", ")}`)
  }
}

const baseUrl = process.env.ROUTE_SMOKE_BASE_URL
const expectedSource = process.env.API_CONTRACT_EXPECT_SOURCE ?? "api"
const futureExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

if (baseUrl) {
  const homeSourceMarker = expectedSource === "demo" ? "API 상태: demo fallback" : "Maple Counter Cafe"
  const flowSourceMarker = expectedSource === "demo" ? "demo-pickup-ready" : "pickup-ready-001"
  const routeChecks = [
    {
      path: "/",
      markers: ["data-api-source=", homeSourceMarker, "API 상태"],
    },
    {
      path: "/pickup-flow",
      markers: ["data-api-source=", flowSourceMarker, "API 상태", "data-booking-mode="],
    },
    {
      path: "/host",
      markers: ["data-api-source=", "data-host-ops-mode=", "호스트 운영 작업"],
    },
    {
      path: "/friend-permission",
      markers: ["data-api-source=", "data-auth-mode=", "친구에게 픽업 권한 공유"],
    },
    {
      path: "/admin",
      markers: ["data-api-source=", "data-admin-trust-mode=", "분쟁 / 리스크 판단"],
    },
  ]

  for (const check of routeChecks) {
    const response = await fetch(`${baseUrl}${check.path}`)

    if (!response.ok) {
      throw new Error(`${check.path} returned ${response.status}`)
    }

    const html = await response.text()
    const missing = check.markers.filter((marker) => !html.includes(marker))

    if (missing.length > 0) {
      throw new Error(`${check.path} missing route markers: ${missing.join(", ")}`)
    }

    console.log(`${check.path} contract ok`)
  }

  if (expectedSource === "api") {
    const createResponse = await fetch(`${baseUrl}/api/pickup-requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        hub_id: "hub-maple-counter",
        user_id: "user-jieun",
        package_size: "small parcel",
        pickup_window: "2026-06-14 18:00-20:30",
        delivery_note: "Smoke create via frontend proxy",
      }),
    })

    if (createResponse.status !== 201) {
      throw new Error(`frontend create proxy returned ${createResponse.status}`)
    }

    const created = await createResponse.text()
    const createMarkers = ["pickup-created-", "\"status\":\"confirmed\"", "\"payment\""]
    const missingCreateMarkers = createMarkers.filter((marker) => !created.includes(marker))

    if (missingCreateMarkers.length > 0) {
      throw new Error(`frontend create proxy missing markers: ${missingCreateMarkers.join(", ")}`)
    }

    console.log("/api/pickup-requests create ok")
    const createdPickupRequest = JSON.parse(created)

    const hostActionResponse = await fetch(`${baseUrl}/api/host-operations/${createdPickupRequest.id}/actions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "receive_package",
        storage_slot_id: createdPickupRequest.package.storageSlotId,
        note: "Smoke host receive via frontend proxy",
      }),
    })

    if (hostActionResponse.status !== 200) {
      throw new Error(`frontend host action proxy returned ${hostActionResponse.status}`)
    }

    const hostAction = await hostActionResponse.text()
    const hostActionMarkers = [createdPickupRequest.id, "\"action\":\"assign_storage\"", "\"status\":\"received\""]
    const missingHostActionMarkers = hostActionMarkers.filter((marker) => !hostAction.includes(marker))

    if (missingHostActionMarkers.length > 0) {
      throw new Error(`frontend host action proxy missing markers: ${missingHostActionMarkers.join(", ")}`)
    }

    console.log("/api/host-operations action ok")

    const friendCreateResponse = await fetch(`${baseUrl}/api/pickup-authorizations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        pickup_request_id: "pickup-ready-001",
        authorized_picker_name: "Smoke Friend",
        expires_at: futureExpiry,
      }),
    })

    if (friendCreateResponse.status !== 201) {
      throw new Error(`friend authorization create returned ${friendCreateResponse.status}`)
    }

    const friendCreated = await friendCreateResponse.json()
    const friendCreateMarkers = ["auth-created-", "oneTimeCode", "active"]
    const friendCreateText = JSON.stringify(friendCreated)
    const missingFriendCreateMarkers = friendCreateMarkers.filter((marker) => !friendCreateText.includes(marker))

    if (missingFriendCreateMarkers.length > 0) {
      throw new Error(`friend authorization create missing markers: ${missingFriendCreateMarkers.join(", ")}`)
    }

    console.log("/api/pickup-authorizations create ok")

    const friendRevokeResponse = await fetch(`${baseUrl}/api/pickup-authorizations/${friendCreated.id}/revoke`, {
      method: "POST",
    })

    if (friendRevokeResponse.status !== 200) {
      throw new Error(`friend authorization revoke returned ${friendRevokeResponse.status}`)
    }

    const revoked = await friendRevokeResponse.text()
    if (!revoked.includes("\"status\":\"revoked\"")) {
      throw new Error("friend authorization revoke missing revoked status")
    }

    console.log("/api/pickup-authorizations revoke ok")

    const consumeCreateResponse = await fetch(`${baseUrl}/api/pickup-authorizations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        pickup_request_id: "pickup-ready-001",
        authorized_picker_name: "Consume Friend",
        expires_at: futureExpiry,
      }),
    })
    const consumable = await consumeCreateResponse.json()
    const consumeResponse = await fetch(`${baseUrl}/api/pickup-authorizations/${consumable.id}/consume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ one_time_code: consumable.oneTimeCode }),
    })
    const secondConsumeResponse = await fetch(`${baseUrl}/api/pickup-authorizations/${consumable.id}/consume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ one_time_code: consumable.oneTimeCode }),
    })

    if (consumeResponse.status !== 200 || secondConsumeResponse.status !== 409) {
      throw new Error(`friend consume statuses ${consumeResponse.status}/${secondConsumeResponse.status}`)
    }

    console.log("/api/pickup-authorizations consume ok")

    const adminActionResponse = await fetch(`${baseUrl}/api/admin-trust/incidents/incident-code-mismatch/actions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "start_review",
        admin_user_id: "admin-ops-1",
        note: "Smoke admin trust review via frontend proxy",
      }),
    })

    if (adminActionResponse.status !== 200) {
      throw new Error(`admin trust action returned ${adminActionResponse.status}`)
    }

    const adminAction = await adminActionResponse.text()
    const adminActionMarkers = ["incident-code-mismatch", "\"status\":\"under_review\"", "\"action\":\"start_review\""]
    const missingAdminActionMarkers = adminActionMarkers.filter((marker) => !adminAction.includes(marker))

    if (missingAdminActionMarkers.length > 0) {
      throw new Error(`admin trust action missing markers: ${missingAdminActionMarkers.join(", ")}`)
    }

    console.log("/api/admin-trust action ok")
  }
}

console.log("api contract source ok")
