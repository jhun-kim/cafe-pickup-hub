import type { ApiHub, ApiPickupRequest, ApiResult } from "@/lib/api-contract"
import { demoContracts } from "@/lib/api-demo"
import { parseHubList, parsePickupRequestList } from "@/lib/api-parsers"

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000"
const API_TIMEOUT_MS = 900

export class ApiContractError extends Error {
  constructor(
    readonly path: string,
    readonly reason: string,
  ) {
    super(`API contract request failed for ${path}: ${reason}`)
  }
}

export type PickupContracts = {
  readonly hubs: readonly ApiHub[]
  readonly pickupRequests: readonly ApiPickupRequest[]
}

export async function loadPickupContracts(): Promise<ApiResult<PickupContracts>> {
  const apiBaseUrl = getApiBaseUrl()

  try {
    const [hubsPayload, pickupRequestsPayload] = await Promise.all([
      fetchJson(apiBaseUrl, "/api/v1/hubs"),
      fetchJson(apiBaseUrl, "/api/v1/pickup-requests"),
    ])
    const hubs = parseHubList(hubsPayload)
    const pickupRequests = parsePickupRequestList(pickupRequestsPayload)

    if (hubs.length === 0) {
      return demoContracts(apiBaseUrl, "API returned zero hubs")
    }

    return {
      data: { hubs, pickupRequests },
      source: { kind: "api", apiBaseUrl },
    }
  } catch (error) {
    if (error instanceof ApiContractError) {
      return demoContracts(apiBaseUrl, error.reason)
    }
    throw error
  }
}

function getApiBaseUrl(): string {
  return process.env["NEXT_PUBLIC_API_BASE_URL"] ?? DEFAULT_API_BASE_URL
}

async function fetchJson(apiBaseUrl: string, path: string): Promise<unknown> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      cache: "no-store",
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new ApiContractError(path, `HTTP ${response.status}`)
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
