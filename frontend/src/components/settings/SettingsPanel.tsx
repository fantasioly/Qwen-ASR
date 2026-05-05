import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Save } from 'lucide-react'
import {
  type SettingsResponse,
  type UpdateSettingsRequest,
  getSettings,
  updateSettings,
} from '@/api/settings'
import { cn } from '@/lib/utils'

interface FieldState {
  api_base_url: string
  api_key: string
  port: number
  cors_origins: string
  request_timeout: number
}

export default function SettingsPanel() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null)
  const [fields, setFields] = useState<FieldState>({
    api_base_url: '',
    api_key: '',
    port: 8000,
    cors_origins: 'http://localhost:5173',
    request_timeout: 30,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    getSettings()
      .then((data) => {
        setSettings(data)
        setFields({
          api_base_url: data.api_base_url,
          api_key: data.api_key,
          port: data.port,
          cors_origins: data.cors_origins,
          request_timeout: data.request_timeout,
        })
      })
      .catch((err) => {
        toast.error(`Failed to load settings: ${err.message}`)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const handleSave = async () => {
    // URL format validation (T-02-01 mitigation)
    if (fields.api_base_url) {
      try {
        new URL(fields.api_base_url)
      } catch {
        toast.error('Invalid URL format for API Base URL')
        return
      }
    }

    // Only send fields that differ from current settings
    const payload: UpdateSettingsRequest = {}
    if (settings && fields.api_base_url !== settings.api_base_url) {
      payload.api_base_url = fields.api_base_url
    }
    if (settings && fields.api_key !== settings.api_key) {
      payload.api_key = fields.api_key
    }
    if (settings && fields.port !== settings.port) {
      payload.port = fields.port
    }
    if (settings && fields.cors_origins !== settings.cors_origins) {
      payload.cors_origins = fields.cors_origins
    }
    if (settings && fields.request_timeout !== settings.request_timeout) {
      payload.request_timeout = fields.request_timeout
    }

    if (Object.keys(payload).length === 0) {
      toast.info('No changes to save')
      return
    }

    setIsSaving(true)
    try {
      const result = await updateSettings(payload)
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              ...(payload.api_base_url !== undefined && { api_base_url: payload.api_base_url }),
              ...(payload.api_key !== undefined && { api_key: '***' }),
              ...(payload.port !== undefined && { port: payload.port }),
              ...(payload.cors_origins !== undefined && { cors_origins: payload.cors_origins }),
              ...(payload.request_timeout !== undefined && {
                request_timeout: payload.request_timeout,
              }),
            }
          : prev,
      )
      toast.success(result.message, {
        description: `Updated: ${result.updated_keys.join(', ')}`,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error('Failed to save settings', { description: message })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure the backend API connection and behavior
        </p>
      </div>

      <div className="space-y-4">
        {/* API Base URL */}
        <div>
          <label
            htmlFor="api_base_url"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            API Base URL
          </label>
          <input
            id="api_base_url"
            type="url"
            value={fields.api_base_url}
            onChange={(e) =>
              setFields((prev) => ({ ...prev, api_base_url: e.target.value }))
            }
            disabled={isSaving}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="http://10.50.193.74:30003/v1"
          />
        </div>

        {/* API Key */}
        <div>
          <label
            htmlFor="api_key"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            API Key
          </label>
          <div className="relative">
            <input
              id="api_key"
              type={showApiKey ? 'text' : 'password'}
              value={fields.api_key}
              onChange={(e) =>
                setFields((prev) => ({ ...prev, api_key: e.target.value }))
              }
              disabled={isSaving}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter API key"
            />
            <button
              type="button"
              onClick={() => setShowApiKey((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              tabIndex={-1}
            >
              {showApiKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Port */}
        <div>
          <label
            htmlFor="port"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Backend Port
          </label>
          <input
            id="port"
            type="number"
            min={1}
            max={65535}
            value={fields.port}
            onChange={(e) =>
              setFields((prev) => ({ ...prev, port: Number(e.target.value) }))
            }
            disabled={isSaving}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* CORS Origins */}
        <div>
          <label
            htmlFor="cors_origins"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            CORS Origins
          </label>
          <input
            id="cors_origins"
            type="text"
            value={fields.cors_origins}
            onChange={(e) =>
              setFields((prev) => ({ ...prev, cors_origins: e.target.value }))
            }
            disabled={isSaving}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="http://localhost:5173"
          />
        </div>

        {/* Request Timeout */}
        <div>
          <label
            htmlFor="request_timeout"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Request Timeout (seconds)
          </label>
          <input
            id="request_timeout"
            type="number"
            min={1}
            max={300}
            value={fields.request_timeout}
            onChange={(e) =>
              setFields((prev) => ({
                ...prev,
                request_timeout: Number(e.target.value),
              }))
            }
            disabled={isSaving}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Model Name (read-only) */}
        <div>
          <label
            htmlFor="model_name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Model Name
          </label>
          <input
            id="model_name"
            type="text"
            value={settings?.model_name ?? ''}
            readOnly
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-400">Informational — not editable</p>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center justify-end pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            isSaving
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm',
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  )
}
