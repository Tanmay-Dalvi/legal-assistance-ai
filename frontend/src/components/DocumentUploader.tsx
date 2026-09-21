import { useState, useRef } from 'react'
import { UploadCloud, File, AlertCircle, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useDocumentUpload } from '../hooks/useDocumentUpload'
import { DocumentResponse } from '../types/document'
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL } from '../utils/constants'

interface DocumentUploaderProps {
  onUploadSuccess?: (doc: DocumentResponse) => void
}

export default function DocumentUploader({ onUploadSuccess }: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { upload, isUploading, error, clearError } = useDocumentUpload(onUploadSuccess)

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File exceeds the maximum size of ${MAX_FILE_SIZE_LABEL}.`
    }
    
    const validExtensions = ['.pdf', '.docx', '.txt']
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    )
    
    if (!hasValidExtension) {
      return 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.'
    }
    
    return null
  }

  const handleFileSelect = (file: File) => {
    clearError()
    setValidationError(null)
    const validationError = validateFile(file)
    if (validationError) {
      setSelectedFile(null)
      setValidationError(validationError)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setSelectedFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleUploadClick = async () => {
    if (!selectedFile) return
    try {
      await upload(selectedFile)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (e) {
      // Error is handled by the hook
    }
  }

  return (
    <div className="w-full">
      <div 
        className={clsx(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200",
          isDragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
          (isUploading || selectedFile) && "pointer-events-none opacity-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
          }}
          disabled={isUploading || !!selectedFile}
          aria-label="Upload document"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
          <div className="p-4 bg-white rounded-full shadow-sm">
            <UploadCloud className="w-8 h-8 text-brand-500" />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-900">
              Drag and drop your document here
            </p>
            <p className="text-sm text-slate-500 mt-1">
              or click to browse from your computer
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span>PDF, DOCX, TXT</span>
            <span>•</span>
            <span>Max {MAX_FILE_SIZE_LABEL}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">{error}</div>
          <button onClick={clearError} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {validationError && !error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700" role="alert">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">{validationError}</div>
          <button onClick={() => setValidationError(null)} className="text-red-500 hover:text-red-700" aria-label="Dismiss validation error">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedFile && !error && (
        <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <File className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedFile(null)
                clearError()
                setValidationError(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              disabled={isUploading}
              className="btn-ghost !p-2"
              aria-label="Cancel upload"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="btn-primary"
            >
              {isUploading ? 'Uploading...' : 'Upload & Analyze'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
