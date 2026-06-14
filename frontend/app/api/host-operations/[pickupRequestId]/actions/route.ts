import { NextResponse } from "next/server"

import type { ApiHostOperationAction, HostOperationActionInput } from "@/lib/api-contract"
import { applyHostOperation } from "@/lib/api-client"
import { ApiContractError } from "@/lib/api-errors"

type RouteContext = {
  readonly params: Promise<{
    readonly pickupRequestId: string
  }>
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const params = await context.params
    const payload: unknown = await request.json()
    const actionPayload = parseActionPayload(params.pickupRequestId, payload)
    const hostOperation = await applyHostOperation(actionPayload)
    return NextResponse.json(hostOperation)
  } catch (error) {
    if (error instanceof BadHostOperationPayloadError) {
      return NextResponse.json({ detail: error.message }, { status: 400 })
    }
    if (error instanceof ApiContractError) {
      return NextResponse.json({ detail: error.reason }, { status: 502 })
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ detail: "Invalid JSON payload" }, { status: 400 })
    }
    throw error
  }
}

class BadHostOperationPayloadError extends Error {}

function parseActionPayload(pickupRequestId: string, payload: unknown): HostOperationActionInput {
  if (!isRecord(payload)) {
    throw new BadHostOperationPayloadError("Request body must be an object")
  }
  const action = readString(payload, "action")
  const storageSlotId = readOptionalString(payload, "storage_slot_id")
  const pickupCode = readOptionalString(payload, "pickup_code")
  const note = readString(payload, "note")

  if (!isHostOperationAction(action) || note === null) {
    throw new BadHostOperationPayloadError("Missing required host operation fields")
  }

  return makeActionInput({ pickupRequestId, action, storageSlotId, pickupCode, note })
}

type ParsedActionInput = {
  readonly pickupRequestId: string
  readonly action: ApiHostOperationAction
  readonly storageSlotId: string | undefined
  readonly pickupCode: string | undefined
  readonly note: string
}

function makeActionInput(input: ParsedActionInput): HostOperationActionInput {
  return {
    pickupRequestId: input.pickupRequestId,
    action: input.action,
    note: input.note,
    ...(input.storageSlotId ? { storageSlotId: input.storageSlotId } : {}),
    ...(input.pickupCode ? { pickupCode: input.pickupCode } : {}),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key]
  return typeof value === "string" && value.trim().length > 0 ? value : undefined
}

function isHostOperationAction(value: string | null): value is ApiHostOperationAction {
  return value === "receive_package" || value === "assign_storage" || value === "complete_handoff"
}
