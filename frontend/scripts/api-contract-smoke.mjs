import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const requiredFiles = [
  "lib/api-contract.ts",
  "lib/api-client.ts",
  "lib/api-view-models.ts",
  "components/pickup/BookingForm.tsx",
  "app/api/pickup-requests/route.ts",
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
  }
}

console.log("api contract source ok")
