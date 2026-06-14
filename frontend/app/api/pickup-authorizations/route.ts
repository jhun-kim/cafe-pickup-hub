import { NextResponse } from "next/server"

import type { CreatePickupAuthorizationInput } from "@/lib/api-contract"
import { createPickupAuthorization, loadFriendAuthorizations } from "@/lib/api-client"
import { ApiContractError } from "@/lib/api-errors"

export async function GET(): Promise<NextResponse> {
  const result = await loadFriendAuthorizations()
  return NextResponse.json(result)
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload: unknown = await request.json()
    const createPayload = parseCreatePayload(payload)
    const authorization = await createPickupAuthorization(createPayload)
    return NextResponse.json(authorization, { status: 201 })
  } catch (error) {
    if (error instanceof BadAuthorizationPayloadError) {
      return NextResponse.json({ detail: error.message }, { status: 400 })
    }
    if (error instanceof ApiContractError) {
      return NextResponse.json({ detail: error.reason }, { status: error.statusCode ?? 502 })
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ detail: "Invalid JSON payload" }, { status: 400 })
    }
    throw error
  }
}

class BadAuthorizationPayloadError extends Error {}

function parseCreatePayload(payload: unknown): CreatePickupAuthorizationInput {
  if (!isRecord(payload)) {
    throw new BadAuthorizationPayloadError("Request body must be an object")
  }
  const pickupRequestId = readString(payload, "pickup_request_id")
  const authorizedPickerName = readString(payload, "authorized_picker_name")
  const expiresAt = readString(payload, "expires_at")

  if (!pickupRequestId || !authorizedPickerName || !expiresAt) {
    throw new BadAuthorizationPayloadError("Missing required authorization fields")
  }

  return { pickupRequestId, authorizedPickerName, expiresAt }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === "string" && value.trim().length > 0 ? value : null
}
