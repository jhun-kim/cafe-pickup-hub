import type { FriendAuthorizationContracts } from "@/lib/api-client"
import { loadFriendAuthorizations } from "@/lib/api-client"
import type { ApiDataSource, ApiPickupAuthorization, ApiPickupRequest, ApiResult } from "@/lib/api-contract"
import { getSameOriginBaseUrl } from "@/lib/same-origin-url"

export async function loadFriendAuthorizationsFromSameOrigin(): Promise<ApiResult<FriendAuthorizationContracts>> {
  let payload: unknown
  try {
    const response = await fetch(`${getSameOriginBaseUrl()}/api/pickup-authorizations`, { cache: "no-store" })
    payload = await response.json()
  } catch (error) {
    if (error instanceof Error) {
      return loadFriendAuthorizations()
    }
    throw error
  }

  const parsed = parseRouteData(payload)
  if (parsed === null) {
    throw new Error("Friend authorization same-origin route returned invalid data")
  }
  return parsed
}

function parseRouteData(payload: unknown): ApiResult<FriendAuthorizationContracts> | null {
  if (!isRecord(payload)) {
    return null
  }
  const data = payload["data"]
  const source = parseSource(payload["source"])
  if (!isRecord(data) || source === null) {
    return null
  }
  const pickupRequest = data["pickupRequest"]
  const authorizations = data["authorizations"]
  const parsedPickupRequest = parseNullablePickupRequest(pickupRequest)
  if (parsedPickupRequest === undefined) {
    return null
  }
  const parsedAuthorizations = parseAuthorizations(authorizations)
  if (parsedAuthorizations === null) {
    return null
  }
  return {
    data: {
      pickupRequest: parsedPickupRequest,
      authorizations: parsedAuthorizations,
    },
    source,
  }
}

function parseSource(payload: unknown): ApiDataSource | null {
  if (!isRecord(payload)) {
    return null
  }
  const kind = payload["kind"]
  const apiBaseUrl = payload["apiBaseUrl"]
  if (kind === "api" && typeof apiBaseUrl === "string") {
    return { kind, apiBaseUrl }
  }
  const reason = payload["reason"]
  if (kind === "demo" && typeof apiBaseUrl === "string" && typeof reason === "string") {
    return { kind, apiBaseUrl, reason }
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseNullablePickupRequest(payload: unknown): ApiPickupRequest | null | undefined {
  if (payload === null) {
    return null
  }
  return parsePickupRequest(payload) ?? undefined
}

function parseAuthorizations(payload: unknown): readonly ApiPickupAuthorization[] | null {
  if (!Array.isArray(payload)) {
    return null
  }
  return payload.map(parsePickupAuthorization).filter(isPresent)
}

function parsePickupRequest(payload: unknown): ApiPickupRequest | null {
  if (!isRecord(payload)) {
    return null
  }
  const id = readString(payload, "id")
  const userId = readString(payload, "userId")
  const hubId = readString(payload, "hubId")
  const status = readString(payload, "status")
  const packagePayload = parsePackage(payload["package"])
  const payment = parsePayment(payload["payment"])
  const authorizations = parseAuthorizations(payload["authorizations"])
  const pickupCode = readString(payload, "pickupCode")
  const pickupWindow = readString(payload, "pickupWindow")
  if (
    id === null ||
    userId === null ||
    hubId === null ||
    !isPickupRequestStatus(status) ||
    packagePayload === null ||
    payment === null ||
    authorizations === null ||
    pickupCode === null ||
    pickupWindow === null
  ) {
    return null
  }
  return { id, userId, hubId, status, package: packagePayload, payment, authorizations, pickupCode, pickupWindow }
}

function parsePackage(payload: unknown): ApiPickupRequest["package"] | null {
  if (!isRecord(payload)) {
    return null
  }
  const id = readString(payload, "id")
  const pickupRequestId = readString(payload, "pickupRequestId")
  const storageSlotId = readString(payload, "storageSlotId")
  const status = readString(payload, "status")
  const sizeLabel = readString(payload, "sizeLabel")
  const arrivalNote = readString(payload, "arrivalNote")
  if (
    id === null ||
    pickupRequestId === null ||
    storageSlotId === null ||
    !isPackageStatus(status) ||
    sizeLabel === null ||
    arrivalNote === null
  ) {
    return null
  }
  return { id, pickupRequestId, storageSlotId, status, sizeLabel, arrivalNote }
}

function parsePayment(payload: unknown): ApiPickupRequest["payment"] | null {
  if (!isRecord(payload)) {
    return null
  }
  const id = readString(payload, "id")
  const pickupRequestId = readString(payload, "pickupRequestId")
  const amountKrw = readNumber(payload, "amountKrw")
  const status = readString(payload, "status")
  if (id === null || pickupRequestId === null || amountKrw === null || status === null) {
    return null
  }
  return { id, pickupRequestId, amountKrw, status }
}

function parsePickupAuthorization(payload: unknown): ApiPickupAuthorization | null {
  if (!isRecord(payload)) {
    return null
  }
  const id = readString(payload, "id")
  const pickupRequestId = readString(payload, "pickupRequestId")
  const authorizedPickerName = readString(payload, "authorizedPickerName")
  const status = readString(payload, "status")
  const codeHint = readString(payload, "codeHint")
  const expiresAt = readString(payload, "expiresAt")
  if (
    id === null ||
    pickupRequestId === null ||
    authorizedPickerName === null ||
    !isAuthorizationStatus(status) ||
    codeHint === null ||
    expiresAt === null
  ) {
    return null
  }
  return { id, pickupRequestId, authorizedPickerName, status, codeHint, expiresAt }
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === "string" ? value : null
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key]
  return typeof value === "number" ? value : null
}

function isPresent<T>(value: T | null): value is T {
  return value !== null
}

function isPickupRequestStatus(value: string | null): value is ApiPickupRequest["status"] {
  return (
    value === "draft" ||
    value === "confirmed" ||
    value === "ready_for_pickup" ||
    value === "completed" ||
    value === "canceled" ||
    value === "expired" ||
    value === "disputed" ||
    value === "payment_failed"
  )
}

function isPackageStatus(value: string | null): value is ApiPickupRequest["package"]["status"] {
  return value === "expected" || value === "received" || value === "picked_up" || value === "not_received" || value === "disputed"
}

function isAuthorizationStatus(value: string | null): value is ApiPickupAuthorization["status"] {
  return value === "active" || value === "used" || value === "expired" || value === "revoked"
}
