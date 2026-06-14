import { NextResponse } from "next/server"

import { consumePickupAuthorization } from "@/lib/api-client"
import { ApiContractError } from "@/lib/api-errors"

type RouteContext = {
  readonly params: Promise<{
    readonly authorizationId: string
  }>
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const params = await context.params
    const payload: unknown = await request.json()
    const oneTimeCode = parseConsumePayload(payload)
    const authorization = await consumePickupAuthorization({ authorizationId: params.authorizationId, oneTimeCode })
    return NextResponse.json(authorization)
  } catch (error) {
    if (error instanceof BadConsumePayloadError) {
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

class BadConsumePayloadError extends Error {}

function parseConsumePayload(payload: unknown): string {
  if (!isRecord(payload)) {
    throw new BadConsumePayloadError("Request body must be an object")
  }
  const oneTimeCode = payload["one_time_code"]
  if (typeof oneTimeCode !== "string" || oneTimeCode.trim().length === 0) {
    throw new BadConsumePayloadError("Missing one-time code")
  }
  return oneTimeCode
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
