import {
  type TranscribeResponse,
  type TranscribeError,
  SUPPORTED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from '@/types/transcribe'

/**
 * Validates an audio file before upload.
 *
 * Checks both file extension (case-insensitive) and file size against
 * the supported formats and 50MB limit.
 *
 * Per D-11: reject unsupported formats with specific error message.
 * Per D-04: reject oversized files before sending to server.
 *
 * @param file - The File object to validate
 * @returns Validation result with reason if invalid
 */
export function validateFile(
  file: File,
): { valid: true } | { valid: false; reason: string } {
  // Case-insensitive extension check
  const dotIndex = file.name.lastIndexOf('.')
  if (dotIndex === -1) {
    return {
      valid: false,
      reason: 'Unsupported format. Use WAV, MP3, M4A, OGG, FLAC, WEBM, MP4.',
    }
  }
  const ext = file.name.slice(dotIndex + 1).toLowerCase()

  if (!SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) {
    return {
      valid: false,
      reason: 'Unsupported format. Use WAV, MP3, M4A, OGG, FLAC, WEBM, MP4.',
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      reason: 'File too large. Maximum size is 50MB.',
    }
  }

  return { valid: true }
}

/**
 * Uploads an audio file to the transcription endpoint using XMLHttpRequest.
 *
 * Uses XMLHttpRequest (NOT fetch) because fetch does not support
 * upload progress events, which are essential for D-05 (progress bar per file).
 *
 * @param file - The audio file to transcribe
 * @param onProgress - Optional callback receiving 0-100 percentage
 * @param signal - Optional AbortSignal for cancellation
 * @returns Object containing the XHR instance and a Promise for the result
 */
export function uploadAudio(
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): { xhr: XMLHttpRequest; promise: Promise<TranscribeResponse> } {
  const xhr = new XMLHttpRequest()

  // Wire upload progress events
  xhr.upload.onprogress = (e: ProgressEvent) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100)
      onProgress?.(percent)
    }
  }

  const promise = new Promise<TranscribeResponse>((resolve, reject) => {
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)

        if (xhr.status >= 400) {
          // Backend structured error: { detail: { error, message, code } }
          const errorData: TranscribeError =
            data?.detail ?? {
              error: 'unknown',
              message: data?.message ?? `Request failed with status ${xhr.status}`,
              code: xhr.status,
            }
          reject(errorData)
          return
        }

        resolve(data as TranscribeResponse)
      } catch {
        reject({
          error: 'parse_error',
          message: 'Failed to parse server response',
          code: xhr.status,
        })
      }
    }

    xhr.onerror = () => {
      reject({
        error: 'network_error',
        message: 'Network error during upload',
        code: 0,
      })
    }

    xhr.onabort = () => {
      reject({
        error: 'aborted',
        message: 'Upload was cancelled',
        code: 0,
      })
    }

    xhr.open('POST', '/api/transcribe')

    const formData = new FormData()
    formData.append('file', file)

    xhr.send(formData)
  })

  // Wire abort signal
  const abort = () => xhr.abort()
  signal?.addEventListener('abort', abort, { once: true })

  return { xhr, promise }
}
