export class ApiError extends Error {
  readonly status: number
  readonly conflictData?: unknown

  constructor(status: number, message: string, conflictData?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.conflictData = conflictData
  }
}
