/**
 * Transcribe types and constants for the file upload transcription feature.
 *
 * Defines the data contracts between the frontend and the backend
 * POST /api/transcribe endpoint, including supported file formats,
 * size limits, and queue management structures.
 */

/**
 * Supported audio file extensions (case-insensitive matching).
 * Per D-11: WAV, MP3, MP4, M4A, OGG, FLAC, WEBM.
 */
export const SUPPORTED_EXTENSIONS: readonly ['wav', 'mp3', 'mp4', 'm4a', 'ogg', 'flac', 'webm'] =
  ['wav', 'mp3', 'mp4', 'm4a', 'ogg', 'flac', 'webm'] as const

/**
 * Maximum allowed file size in bytes (50MB).
 * Per D-04: Client-side rejection threshold before upload.
 */
export const MAX_FILE_SIZE_BYTES: number = 50 * 1024 * 1024 // 52_428_800

/**
 * Token usage information returned by the transcription API.
 * Matches backend/app/routers/transcribe.py response.usage structure.
 */
export interface TranscribeUsage {
  prompt_tokens: number
  completion_tokens: number
}

/**
 * Successful transcription response from POST /api/transcribe.
 * Matches exact JSON shape returned by backend.
 */
export interface TranscribeResponse {
  text: string
  language: string
  usage: TranscribeUsage | null
  processing_time_ms: number
}

/**
 * Structured error from backend transcription endpoint.
 * Matches backend/app/errors.py structured_error format:
 * { detail: { error, message, code } }
 */
export interface TranscribeError {
  error: string
  message: string
  code: number
}

/**
 * A single transcription job in the processing queue.
 * Tracks file, status, progress, and outcome.
 */
export interface TranscribeJob {
  file: File
  status: 'queued' | 'uploading' | 'processing' | 'complete' | 'failed'
  progress: number // 0-100 percentage
  result?: TranscribeResponse
  error?: TranscribeError
}

/**
 * Aggregate state of the transcription queue.
 * Used by useTranscribeQueue hook.
 */
export interface TranscribeQueueState {
  jobs: TranscribeJob[]
  isProcessing: boolean
  currentJobIndex: number | null
}
