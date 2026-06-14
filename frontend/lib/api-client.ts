import type {
  ApiHostOperationItem,
  ApiHub,
  ApiPickupRequest,
  ApiResult,
  CreatePickupRequestInput,
  HostOperationActionInput,
} from "@/lib/api-contract"
import { demoContracts, demoHostOperations } from "@/lib/api-demo"
import { ApiContractError } from "@/lib/api-errors"
import { parseHostOperationList, parseHostOperationResponse } from "@/lib/host-operations-parser"
import { parseHubList, parsePickupRequestList, parsePickupRequestResponse } from "@/lib/api-parsers"

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000"
const API_TIMEOUT_MS = 900

export type PickupContracts = {
  readonly hubs: readonly ApiHub[]
  readonly pickupRequests: readonly ApiPickupRequest[]
}

export type HostOperationContracts = {
  readonly operations: readonly ApiHostOperationItem[]
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

export async function loadHostOperations(): Promise<ApiResult<HostOperationContracts>> {
  const apiBaseUrl = getApiBaseUrl()

  try {
    const operationsPayload = await fetchJson(apiBaseUrl, "/api/v1/host/operations")
    const operations = parseHostOperationList(operationsPayload)
    return {
      data: { operations },
      source: { kind: "api", apiBaseUrl },
    }
  } catch (error) {
    if (error instanceof ApiContractError) {
      return demoHostOperations(apiBaseUrl, error.reason)
    }
    throw error
  }
}

export async function createPickupRequest(payload: CreatePickupRequestInput): Promise<ApiPickupRequest> {
  const apiBaseUrl = getApiBaseUrl()
  const responsePayload = await fetchJson(apiBaseUrl, "/api/v1/pickup-requests", {
    method: "POST",
    body: JSON.stringify({
      hub_id: payload.hubId,
      user_id: payload.userId,
      package_size: payload.packageSize,
      pickup_window: payload.pickupWindow,
      delivery_note: payload.deliveryNote,
    }),
  })
  return parsePickupRequestResponse(responsePayload)
}

export async function applyHostOperation(payload: HostOperationActionInput): Promise<ApiHostOperationItem> {
  const apiBaseUrl = getApiBaseUrl()
  const responsePayload = await fetchJson(apiBaseUrl, `/api/v1/host/operations/${payload.pickupRequestId}/actions`, {
    method: "POST",
    body: JSON.stringify({
      action: payload.action,
      storage_slot_id: payload.storageSlotId,
      pickup_code: payload.pickupCode,
      note: payload.note,
    }),
  })
  return parseHostOperationResponse(responsePayload)
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

  return {
    cache: "no-store",
    method: options.method ?? "GET",
    signal,
  }
}
