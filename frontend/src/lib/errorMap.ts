/**
 * Centralized error message mapping for transcription errors.
 * Per D-38, D-39: maps error codes to actionable user-friendly guidance.
 */

import { type TranscribeError } from '@/types/transcribe'

export const ERROR_MESSAGES: Record<string, string> = {
  timeout: 'Request took too long. Try a shorter audio clip.',
  connection_failed: 'Cannot reach vLLM server. Check network and API settings.',
  transcription_failed: 'Model error. Check Settings tab for correct API URL and key.',
  network_error: 'Network unavailable. Check your connection.',
  parse_error: 'Failed to parse server response. Try again.',
  aborted: 'Upload was cancelled.',
}

/**
 * Get a user-friendly error message from a TranscribeError.
 * Falls back to the raw error message if no mapping exists.
 */
export function getErrorFriendlyMessage(error: TranscribeError): string {
  return ERROR_MESSAGES[error.error] ?? error.message ?? 'An unexpected error occurred.'
}

/**
 * Check if an error is retryable (not user-cancelled).
 */
export function isRetryableError(error: TranscribeError): boolean {
  return error.error !== 'aborted'
}
