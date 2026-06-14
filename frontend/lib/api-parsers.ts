import type { ApiHub, ApiPickupAuthorization, ApiPackage, ApiPickupRequest, ApiStorageSlot } from "@/lib/api-contract"
import { ApiContractError } from "@/lib/api-errors"

export function parseHubList(payload: unknown): readonly ApiHub[] {
  if (!Array.isArray(payload)) {
    throw new ApiContractError("/api/v1/hubs", "response is not an array")
  }
  return payload.map(parseHub).filter(isPresent)
}

export function parsePickupRequestList(payload: unknown): readonly ApiPickupRequest[] {
  if (!Array.isArray(payload)) {
    throw new ApiContractError("/api/v1/pickup-requests", "response is not an array")
  }
  return payload.map(parsePickupRequest).filter(isPresent)
}

export function parsePickupRequestResponse(payload: unknown): ApiPickupRequest {
  const pickupRequest = parsePickupRequest(payload)
  if (pickupRequest === null) {
    throw new ApiContractError("/api/v1/pickup-requests", "response is not a pickup request")
  }
  return pickupRequest
}

function parseHub(payload: unknown): ApiHub | null {
  if (!isRecord(payload)) {
    return null
  }
  const id = readString(payload, "id")
  const hostId = readString(payload, "host_id")
  const cafeName = readString(payload, "cafe_name")
  const neighborhood = readString(payload, "neighborhood")
  const address = readString(payload, "address")
  const walkMinutesFromStation = readNumber(payload, "walk_minutes_from_station")
  const rating = readNumber(payload, "rating")
  const openUntil = readString(payload, "open_until")
  const availableSlots = readNumber(payload, "available_slots")
  const pricePerDayKrw = readNumber(payload, "price_per_day_krw")
  const trustBadges = readStringArray(payload, "trust_badges")
  const slotsPayload = payload["storage_slots"]

  if (
    id === null ||
    hostId === null ||
    cafeName === null ||
    neighborhood === null ||
    address === null ||
    walkMinutesFromStation === null ||
    rating === null ||
    openUntil === null ||
    availableSlots === null ||
    pricePerDayKrw === null ||
    trustBadges === null ||
    !Array.isArray(slotsPayload)
  ) {
    return null
  }

  return {
    id,
    hostId,
    cafeName,
    neighborhood,
    address,
    walkMinutesFromStation,
    rating,
    openUntil,
    availableSlots,
    pricePerDayKrw,
    trustBadges,
    storageSlots: slotsPayload.map(parseStorageSlot).filter(isPresent),
  }
}

function parseStorageSlot(payload: unknown): ApiStorageSlot | null {
  if (!isRecord(payload)) {
    return null
  }
  const id = readString(payload, "id")
  const hubId = readString(payload, "hub_id")
  const label = readString(payload, "label")
  const status = readString(payload, "status")
  const packageSize = readString(payload, "package_size")

  if (id === null || hubId === null || label === null || packageSize === null || !isStorageSlotStatus(status)) {
    return null
  }

  return { id, hubId, label, status, packageSize }
}

function parsePickupRequest(payload: unknown): ApiPickupRequest | null {
  if (!isRecord(payload)) {
    return null
  }
  const id = readString(payload, "id")
  const userId = readString(payload, "user_id")
  const hubId = readString(payload, "hub_id")
  const status = readString(payload, "status")
  const packagePayload = parsePackage(payload["package"])
  const paymentPayload = parsePayment(payload["payment"])
  const authorizationsPayload = payload["authorizations"]
  const pickupCode = readString(payload, "pickup_code")
  const pickupWindow = readString(payload, "pickup_window")

  if (
    id === null ||
    userId === null ||
    hubId === null ||
    !isPickupRequestStatus(status) ||
    packagePayload === null ||
    paymentPayload === null ||
    !Array.isArray(authorizationsPayload) ||
    pickupCode === null ||
    pickupWindow === null
  ) {
    return null
  }

  return {
    id,
    userId,
    hubId,
    status,
    package: packagePayload,
    payment: paymentPayload,
    authorizations: authorizationsPayload.map(parseAuthorization).filter(isPresent),
    pickupCode,
    pickupWindow,
  }
}

function parsePackage(payload: unknown): ApiPackage | null {
  if (!isRecord(payload)) {
    return null
  }
  const id = readString(payload, "id")
  const pickupRequestId = readString(payload, "pickup_request_id")
  const storageSlotId = readString(payload, "storage_slot_id")
  const status = readString(payload, "status")
  const sizeLabel = readString(payload, "size_label")
  const arrivalNote = readString(payload, "arrival_note")

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
  const pickupRequestId = readString(payload, "pickup_request_id")
  const amountKrw = readNumber(payload, "amount_krw")
  const status = readString(payload, "status")

  if (id === null || pickupRequestId === null || amountKrw === null || status === null) {
    return null
  }

  return { id, pickupRequestId, amountKrw, status }
}

function parseAuthorization(payload: unknown): ApiPickupAuthorization | null {
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

function readNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key]
  return typeof value === "number" ? value : null
}

function readStringArray(record: Record<string, unknown>, key: string): readonly string[] | null {
  const value = record[key]
  if (!Array.isArray(value)) {
    return null
  }
  return value.every((item) => typeof item === "string") ? value : null
}

function isPresent<T>(value: T | null): value is T {
  return value !== null
}

function isStorageSlotStatus(value: string | null): value is ApiStorageSlot["status"] {
  return value === "available" || value === "reserved" || value === "occupied" || value === "out_of_service"
}

function isPackageStatus(value: string | null): value is ApiPackage["status"] {
  return value === "expected" || value === "received" || value === "picked_up" || value === "not_received" || value === "disputed"
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

function isAuthorizationStatus(value: string | null): value is ApiPickupAuthorization["status"] {
  return value === "active" || value === "used" || value === "expired" || value === "revoked"
}
