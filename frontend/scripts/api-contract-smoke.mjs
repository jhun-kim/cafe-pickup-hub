import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const requiredFiles = [
  "lib/api-contract.ts",
  "lib/api-client.ts",
  "lib/api-view-models.ts",
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
    markers: ["getPickupFlowData", "data-api-source"],
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
      markers: ["data-api-source=", flowSourceMarker, "API 상태"],
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
}

console.log("api contract source ok")
