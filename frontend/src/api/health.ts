export interface HealthResponse {
  status: 'ok'
  model: string
  latency_ms: number
}

export interface HealthErrorResponse {
  status: 'error'
  message: string
  code: number
}

export interface APIError {
  error: string
  message: string
  code: number
}

export interface HealthCheckError {
  error: string
  message: string
  code: number
}

export async function checkHealth(
  signal?: AbortSignal,
): Promise<HealthResponse | HealthErrorResponse> {
  const res = await fetch('/api/health', { signal })
  const body = await res.json()

  if (res.ok) {
    return body as HealthResponse
  }

  // FastAPI structured error: { detail: { error, message, code } }
  if (body?.detail) {
    const detail = body.detail as { error: string; message: string; code: number }
    throw Object.assign(new Error(detail.message), {
      error: detail.error,
      code: detail.code,
    } as HealthCheckError)
  }

  // Fallback
  throw new Error(body?.message ?? `Request failed with status ${res.status}`)
}
