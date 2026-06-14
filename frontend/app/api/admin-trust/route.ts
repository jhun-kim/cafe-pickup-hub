import { NextResponse } from "next/server"

import { loadAdminTrust } from "@/lib/admin-trust-client"

export async function GET(): Promise<NextResponse> {
  const result = await loadAdminTrust()
  return NextResponse.json(result)
}
