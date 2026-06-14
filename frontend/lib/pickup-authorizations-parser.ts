import type { ApiPickupAuthorization, ApiPickupAuthorizationCreateResponse } from "@/lib/api-contract"
import { ApiContractError } from "@/lib/api-errors"

export function parsePickupAuthorizationList(payload: unknown): readonly ApiPickupAuthorization[] {
  if (!Array.isArray(payload)) {
    throw new ApiContractError("/api/v1/pickup-authorizations", "response is not an array")
  }
  return payload.map(parsePickupAuthorizationPayload).filter(isPresent)
}

export function parsePickupAuthorizationResponse(payload: unknown): ApiPickupAuthorization {
  const authorization = parsePickupAuthorizationPayload(payload)
  if (authorization === null) {
    throw new ApiContractError("/api/v1/pickup-authorizations", "response is not an authorization")
  }
  return authorization
}

export function parsePickupAuthorizationCreateResponse(payload: unknown): ApiPickupAuthorizationCreateResponse {
  const authorization = parsePickupAuthorizationPayload(payload)
  if (!isRecord(payload) || authorization === null) {
    throw new ApiContractError("/api/v1/pickup-authorizations", "response is not an authorization")
  }
  const oneTimeCode = readString(payload, "one_time_code")
  if (oneTimeCode === null) {
    throw new ApiContractError("/api/v1/pickup-authorizations", "response is missing one-time code")
  }
  return { ...authorization, oneTimeCode }
}

function parsePickupAuthorizationPayload(payload: unknown): ApiPickupAuthorization | null {
  if (!isRecord(payload)) {
    return null
  }
  const id = readString(payload, "id")
  const pickupRequestId = readString(payload, "pickup_request_id")
  const authorizedPickerName = readString(payload, "authorized_picker_name")
  const status = readString(payload, "status")
  const codeHint = readString(payload, "code_hint")
  const expiresAt = readString(payload, "expires_at")

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === "string" ? value : null
}

function isAuthorizationStatus(value: string | null): value is ApiPickupAuthorization["status"] {
  return value === "active" || value === "used" || value === "expired" || value === "revoked"
}

function isPresent<T>(value: T | null): value is T {
  return value !== null
}
