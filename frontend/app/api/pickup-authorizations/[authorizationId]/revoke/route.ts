import { NextResponse } from "next/server"

import { revokePickupAuthorization } from "@/lib/api-client"
import { ApiContractError } from "@/lib/api-errors"

type RouteContext = {
  readonly params: Promise<{
    readonly authorizationId: string
  }>
}

export async function POST(_request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const params = await context.params
    const authorization = await revokePickupAuthorization(params.authorizationId)
    return NextResponse.json(authorization)
  } catch (error) {
    if (error instanceof ApiContractError) {
      return NextResponse.json({ detail: error.reason }, { status: error.statusCode ?? 502 })
    }
    throw error
  }
}
