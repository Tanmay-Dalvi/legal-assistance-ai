/**
 * Shared API response types.
 * Mirrors the backend Pydantic schemas.
 */

/** Standard error shape returned by the backend */
export interface ApiError {
  error: {
    code: string
    message: string
    detail?: Record<string, unknown>
  }
}

/** Generic paginated response */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

/** Health check response */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error'
  version: string
  environment: string
  uptime_seconds: number
}

/** Readiness check response */
export interface ReadinessResponse extends HealthResponse {
  checks: Record<string, { status: string; note?: string | null }>
  python_version: string
}

