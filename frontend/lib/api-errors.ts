export class ApiContractError extends Error {
  constructor(
    readonly path: string,
    readonly reason: string,
  ) {
    super(`API contract request failed for ${path}: ${reason}`)
  }
}
