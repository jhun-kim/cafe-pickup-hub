import type { AdminTrustActionInput, AdminTrustResult, ApiAdminTrustItem } from "@/lib/admin-trust-contract"
import { demoAdminTrust } from "@/lib/admin-trust-demo"
import { parseAdminTrustContracts, parseAdminTrustItem } from "@/lib/admin-trust-parser"
import { ApiContractError } from "@/lib/api-errors"

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000"
const API_TIMEOUT_MS = 900

export async function loadAdminTrust(): Promise<AdminTrustResult> {
  const apiBaseUrl = getApiBaseUrl()

  try {
    const payload = await fetchJson(apiBaseUrl, "/api/v1/admin/trust")
    const data = parseAdminTrustContracts(payload)
    return { data, source: { kind: "api", apiBaseUrl } }
  } catch (error) {
    if (error instanceof ApiContractError) {
      return demoAdminTrust(apiBaseUrl, error.reason)
    }
    throw error
  }
}

export async function applyAdminTrustAction(payload: AdminTrustActionInput): Promise<ApiAdminTrustItem> {
  const apiBaseUrl = getApiBaseUrl()
  const responsePayload = await fetchJson(apiBaseUrl, `/api/v1/admin/trust/incidents/${payload.incidentId}/actions`, {
    method: "POST",
    body: JSON.stringify({
      action: payload.action,
      admin_user_id: payload.adminUserId,
      note: payload.note,
    }),
  })
  return parseAdminTrustItem(responsePayload)
}

function getApiBaseUrl(): string {
  return process.env["NEXT_PUBLIC_API_BASE_URL"] ?? DEFAULT_API_BASE_URL
}

type FetchJsonOptions = {
  readonly method?: "GET" | "POST"
  readonly body?: string
}

async function fetchJson(apiBaseUrl: string, path: string, options: FetchJsonOptions = {}): Promise<unknown> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, makeRequestInit(options, controller.signal))
    if (!response.ok) {
      throw new ApiContractError(path, await readErrorDetail(response), response.status)
    }
    return await response.json()
  } catch (error) {
    if (error instanceof ApiContractError) {
      throw error
    }
    if (error instanceof Error) {
      throw new ApiContractError(path, error.message)
    }
    throw new ApiContractError(path, "unknown fetch failure")
  } finally {
    clearTimeout(timeoutId)
  }
}

async function readErrorDetail(response: Response): Promise<string> {
  const text = await response.text()
  let payload: unknown = null
  try {
    payload = JSON.parse(text)
  } catch (error) {
    if (error instanceof SyntaxError) {
      return `HTTP ${response.status}`
    }
    throw error
  }
  if (!isRecord(payload)) {
    return `HTTP ${response.status}`
  }
  const detail = payload["detail"]
  return typeof detail === "string" ? detail : `HTTP ${response.status}`
}

function makeRequestInit(options: FetchJsonOptions, signal: AbortSignal): RequestInit {
  if (options.body) {
    return {
      body: options.body,
      cache: "no-store",
      headers: { "content-type": "application/json" },
      method: options.method ?? "POST",
      signal,
    }
  }
  return { cache: "no-store", method: options.method ?? "GET", signal }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
