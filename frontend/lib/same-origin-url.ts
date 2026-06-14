const DEFAULT_FRONTEND_BASE_URL = "http://127.0.0.1:3000"

export function getSameOriginBaseUrl(): string {
  return process.env["NEXT_PUBLIC_FRONTEND_BASE_URL"] ?? DEFAULT_FRONTEND_BASE_URL
}
