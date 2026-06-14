import { NextResponse } from "next/server"

import type { CreatePickupRequestInput } from "@/lib/api-contract"
import { createPickupRequest } from "@/lib/api-client"
import { ApiContractError } from "@/lib/api-errors"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload: unknown = await request.json()
    const createPayload = parseCreatePayload(payload)
    const pickupRequest = await createPickupRequest(createPayload)
    return NextResponse.json(pickupRequest, { status: 201 })
  } catch (error) {
    if (error instanceof BadCreatePayloadError) {
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

class BadCreatePayloadError extends Error {}

function parseCreatePayload(payload: unknown): CreatePickupRequestInput {
  if (!isRecord(payload)) {
    throw new BadCreatePayloadError("Request body must be an object")
  }
  const hubId = readString(payload, "hub_id")
  const userId = readString(payload, "user_id")
  const packageSize = readString(payload, "package_size")
  const pickupWindow = readString(payload, "pickup_window")
  const deliveryNote = readString(payload, "delivery_note")

  if (!hubId || !userId || !packageSize || !pickupWindow || !deliveryNote) {
    throw new BadCreatePayloadError("Missing required pickup request fields")
  }

  return { hubId, userId, packageSize, pickupWindow, deliveryNote }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === "string" && value.trim().length > 0 ? value : null
}
