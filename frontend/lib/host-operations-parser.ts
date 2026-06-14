import type { ApiHostOperationAction, ApiHostOperationItem, ApiHostOperationSummary } from "@/lib/api-contract"
import { ApiContractError } from "@/lib/api-errors"
import { parseHubResponse, parsePickupRequestPayload } from "@/lib/api-parsers"

export function parseHostOperationList(payload: unknown): readonly ApiHostOperationItem[] {
  if (!Array.isArray(payload)) {
    throw new ApiContractError("/api/v1/host/operations", "response is not an array")
  }
  return payload.map(parseHostOperationItem).filter(isPresent)
}

export function parseHostOperationResponse(payload: unknown): ApiHostOperationItem {
  const operation = parseHostOperationItem(payload)
  if (operation === null) {
    throw new ApiContractError("/api/v1/host/operations", "response is not a host operation")
  }
  return operation
}

function parseHostOperationItem(payload: unknown): ApiHostOperationItem | null {
  if (!isRecord(payload)) {
    return null
  }
  const hub = parseHubResponse(payload["hub"])
  const pickupRequest = parsePickupRequestPayload(payload["pickup_request"])
  const operation = parseOperationSummary(payload["operation"])

  if (hub === null || pickupRequest === null || operation === null) {
    return null
  }

  return { hub, pickupRequest, operation }
}

function parseOperationSummary(payload: unknown): ApiHostOperationSummary | null {
  if (!isRecord(payload)) {
    return null
  }
  const action = readString(payload, "action")
  const label = readString(payload, "label")
  const priority = readNumber(payload, "priority")
  const nextAction = readNullableAction(payload, "next_action")
  const safetyNote = readString(payload, "safety_note")

  if (!isHostOperationAction(action) || label === null || priority === null || nextAction === undefined || safetyNote === null) {
    return null
  }

  return { action, label, priority, nextAction, safetyNote }
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

function readNullableAction(record: Record<string, unknown>, key: string): ApiHostOperationAction | null | undefined {
  const value = record[key]
  if (value === null) {
    return null
  }
  return typeof value === "string" && isHostOperationAction(value) ? value : undefined
}

function isHostOperationAction(value: string | null): value is ApiHostOperationAction {
  return value === "receive_package" || value === "assign_storage" || value === "complete_handoff"
}

function isPresent<T>(value: T | null): value is T {
  return value !== null
}
