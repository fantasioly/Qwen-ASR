import { useState, useCallback, useRef } from 'react'
import { Upload } from 'lucide-react'
import { SUPPORTED_EXTENSIONS } from '@/types/transcribe'

interface FileUploadZoneProps {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

const ACCEPTED_FORMATS = SUPPORTED_EXTENSIONS.map((ext) => ext.toUpperCase())

export default function FileUploadZone({
  onFiles,
  disabled = false,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) return
      const files = Array.from(fileList)
      if (files.length > 0) {
        onFiles(files)
      }
    },
    [onFiles, disabled],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
      // Reset input so the same file can be selected again
      if (e.target) {
        e.target.value = ''
      }
    },
    [handleFiles],
  )

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-blue-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <Upload
        className="w-8 h-8 mx-auto mb-3 text-gray-400"
        aria-hidden="true"
      />
      <p className="text-sm text-gray-600">
        Drop audio files here or{' '}
        <span className="text-blue-600 underline">click to select</span>
      </p>
      <p className="mt-2 text-xs text-gray-400">
        Supported: {ACCEPTED_FORMATS.join(', ')}
      </p>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  )
}
