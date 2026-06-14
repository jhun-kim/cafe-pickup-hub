import { NextResponse } from "next/server"

import type { AdminTrustActionInput, ApiAdminTrustAction } from "@/lib/admin-trust-contract"
import { applyAdminTrustAction } from "@/lib/admin-trust-client"
import { ApiContractError } from "@/lib/api-errors"

type RouteContext = {
  readonly params: Promise<{
    readonly incidentId: string
  }>
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const params = await context.params
    const payload: unknown = await request.json()
    const actionPayload = parseActionPayload(params.incidentId, payload)
    const item = await applyAdminTrustAction(actionPayload)
    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof BadAdminActionPayloadError) {
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

class BadAdminActionPayloadError extends Error {}

function parseActionPayload(incidentId: string, payload: unknown): AdminTrustActionInput {
  if (!isRecord(payload)) {
    throw new BadAdminActionPayloadError("Request body must be an object")
  }
  const action = readString(payload, "action")
  const adminUserId = readString(payload, "admin_user_id")
  const note = readString(payload, "note")
  if (!isAdminAction(action) || adminUserId === null || note === null) {
    throw new BadAdminActionPayloadError("Missing required admin trust action fields")
  }
  return { incidentId, action, adminUserId, note }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function isAdminAction(value: string | null): value is ApiAdminTrustAction {
  return value === "start_review" || value === "resolve" || value === "escalate"
}
