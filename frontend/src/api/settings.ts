export interface SettingsResponse {
  api_base_url: string
  api_key: string
  port: number
  cors_origins: string
  request_timeout: number
  model_name: string
}

export interface UpdateSettingsRequest {
  api_base_url?: string
  api_key?: string
  port?: number
  cors_origins?: string
  request_timeout?: number
}

export interface UpdateSettingsResponse {
  status: 'ok'
  message: string
  updated_keys: string[]
}

export interface ErrorResponse {
  error: string
  message: string
  code: number
}

export async function getSettings(): Promise<SettingsResponse> {
  const res = await fetch('/api/settings')
  if (!res.ok) {
    const body: ErrorResponse = await res.json()
    throw new Error(body.message ?? `Request failed with status ${res.status}`)
  }
  return res.json()
}

export async function updateSettings(
  data: UpdateSettingsRequest,
): Promise<UpdateSettingsResponse> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body: ErrorResponse = await res.json()
    throw new Error(body.message ?? `Request failed with status ${res.status}`)
  }
  return res.json()
}
