export class ApiContractError extends Error {
  constructor(
    readonly path: string,
    readonly reason: string,
    readonly statusCode: number | null = null,
  ) {
    super(`API contract request failed for ${path}: ${reason}`)
  }
}
