import type {
  ApiHostOperationItem,
  ApiHub,
  ApiPickupAuthorization,
  ApiPickupAuthorizationCreateResponse,
  ApiPickupRequest,
  ApiResult,
  ConsumePickupAuthorizationInput,
  CreatePickupAuthorizationInput,
  CreatePickupRequestInput,
  HostOperationActionInput,
} from "@/lib/api-contract"
import { demoContracts, demoFriendAuthorizations, demoHostOperations } from "@/lib/api-demo"
import { ApiContractError } from "@/lib/api-errors"
import { parseHostOperationList, parseHostOperationResponse } from "@/lib/host-operations-parser"
import { parseHubList, parsePickupRequestList, parsePickupRequestResponse } from "@/lib/api-parsers"
import {
  parsePickupAuthorizationCreateResponse,
  parsePickupAuthorizationList,
  parsePickupAuthorizationResponse,
} from "@/lib/pickup-authorizations-parser"

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000"
const API_TIMEOUT_MS = 900

export type PickupContracts = {
  readonly hubs: readonly ApiHub[]
  readonly pickupRequests: readonly ApiPickupRequest[]
}

export type HostOperationContracts = {
  readonly operations: readonly ApiHostOperationItem[]
}

export type FriendAuthorizationContracts = {
  readonly pickupRequest: ApiPickupRequest | null
  readonly authorizations: readonly ApiPickupAuthorization[]
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

export async function loadFriendAuthorizations(): Promise<ApiResult<FriendAuthorizationContracts>> {
  const apiBaseUrl = getApiBaseUrl()

  try {
    const pickupRequestsPayload = await fetchJson(apiBaseUrl, "/api/v1/pickup-requests")
    const pickupRequests = parsePickupRequestList(pickupRequestsPayload)
    const pickupRequest = pickupRequests.find((item) => item.status === "ready_for_pickup") ?? pickupRequests[0] ?? null
    if (pickupRequest === null) {
      return demoFriendAuthorizations(apiBaseUrl, "API returned zero pickup requests")
    }
    const authorizationsPayload = await fetchJson(apiBaseUrl, `/api/v1/pickup-authorizations?pickup_request_id=${pickupRequest.id}`)
    const authorizations = parsePickupAuthorizationList(authorizationsPayload)
    return {
      data: { pickupRequest, authorizations },
      source: { kind: "api", apiBaseUrl },
    }
  } catch (error) {
    if (error instanceof ApiContractError) {
      return demoFriendAuthorizations(apiBaseUrl, error.reason)
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

export async function createPickupAuthorization(
  payload: CreatePickupAuthorizationInput,
): Promise<ApiPickupAuthorizationCreateResponse> {
  const apiBaseUrl = getApiBaseUrl()
  const responsePayload = await fetchJson(apiBaseUrl, "/api/v1/pickup-authorizations", {
    method: "POST",
    body: JSON.stringify({
      pickup_request_id: payload.pickupRequestId,
      authorized_picker_name: payload.authorizedPickerName,
      expires_at: payload.expiresAt,
    }),
  })
  return parsePickupAuthorizationCreateResponse(responsePayload)
}

export async function revokePickupAuthorization(authorizationId: string): Promise<ApiPickupAuthorization> {
  const apiBaseUrl = getApiBaseUrl()
  const responsePayload = await fetchJson(apiBaseUrl, `/api/v1/pickup-authorizations/${authorizationId}/revoke`, {
    method: "POST",
    body: "{}",
  })
  return parsePickupAuthorizationResponse(responsePayload)
}

export async function consumePickupAuthorization(payload: ConsumePickupAuthorizationInput): Promise<ApiPickupAuthorization> {
  const apiBaseUrl = getApiBaseUrl()
  const responsePayload = await fetchJson(apiBaseUrl, `/api/v1/pickup-authorizations/${payload.authorizationId}/consume`, {
    method: "POST",
    body: JSON.stringify({ one_time_code: payload.oneTimeCode }),
  })
  return parsePickupAuthorizationResponse(responsePayload)
}

function getApiBaseUrl(): string {
  const configuredApiBaseUrl = process.env["NEXT_PUBLIC_API_BASE_URL"]
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl
  }

  const vercelHost = process.env["VERCEL_PROJECT_PRODUCTION_URL"] ?? process.env["VERCEL_URL"]
  if (vercelHost) {
    return `https://${vercelHost}`
  }

  return DEFAULT_API_BASE_URL
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
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
