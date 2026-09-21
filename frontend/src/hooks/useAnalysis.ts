import { useCallback, useState } from 'react'
import { AnalysisAPI } from '../services/analysisService'
import { AnalysisResponse } from '../types/analysis'

export function useAnalysis(documentId: string) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalysis = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await AnalysisAPI.getAnalysis(documentId)
      setAnalysis(result)
      return result
    } catch (err: unknown) {
      const code = (err as { data?: { error?: { code?: string } } }).data?.error?.code
      if (code === 'NOT_FOUND') {
        setAnalysis(null)
        setError(null)
        return null
      }
      const message = err instanceof Error ? err.message : 'Unable to load document analysis.'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  const analyze = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await AnalysisAPI.analyzeDocument(documentId)
      setAnalysis(result)
      return result
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to analyze this document.'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  return { analysis, isLoading, error, loadAnalysis, analyze }
}
