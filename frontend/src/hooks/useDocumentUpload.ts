import { useState, useCallback } from 'react'
import { DocumentAPI } from '../services/api'
import { DocumentResponse } from '../types/document'

export function useDocumentUpload(onSuccess?: (doc: DocumentResponse) => void) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (file: File) => {
      setIsUploading(true)
      setError(null)
      try {
        const doc = await DocumentAPI.uploadDocument(file)
        if (onSuccess) {
          onSuccess(doc)
        }
        return doc
      } catch (err: any) {
        const msg = err.message || 'Failed to upload document.'
        setError(msg)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [onSuccess]
  )

  const clearError = () => setError(null)

  return { upload, isUploading, error, clearError }
}

