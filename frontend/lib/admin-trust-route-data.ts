import type { AdminTrustResult } from "@/lib/admin-trust-contract"
import { loadAdminTrust } from "@/lib/admin-trust-client"
import { parseAdminTrustContracts } from "@/lib/admin-trust-parser"
import { getSameOriginBaseUrl } from "@/lib/same-origin-url"

export async function loadAdminTrustFromSameOrigin(): Promise<AdminTrustResult> {
  let payload: unknown
  try {
    const response = await fetch(`${getSameOriginBaseUrl()}/api/admin-trust`, { cache: "no-store" })
    payload = await response.json()
  } catch (error) {
    if (error instanceof Error) {
      return loadAdminTrust()
    }
    throw error
  }

  if (!isRecord(payload) || !isRecord(payload["source"])) {
    throw new Error("Admin trust same-origin route returned invalid data")
  }
  return {
    data: parseAdminTrustContracts(payload["data"]),
    source: parseSource(payload["source"]),
  }
}

function parseSource(payload: Record<string, unknown>): AdminTrustResult["source"] {
  const kind = payload["kind"]
  const apiBaseUrl = payload["apiBaseUrl"]
  if (kind === "api" && typeof apiBaseUrl === "string") {
    return { kind, apiBaseUrl }
  }
  const reason = payload["reason"]
  if (kind === "demo" && typeof apiBaseUrl === "string" && typeof reason === "string") {
    return { kind, apiBaseUrl, reason }
  }
  throw new Error("Admin trust same-origin route returned invalid source")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
