import { AnalysisResponse } from '../types/analysis'
import { API_BASE_URL } from '../utils/constants'
import { handleResponse } from './api'

export const AnalysisAPI = {
  analyzeDocument: async (documentId: string): Promise<AnalysisResponse> => {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/analyze`, { method: 'POST' })
    return handleResponse<AnalysisResponse>(response)
  },

  getAnalysis: async (documentId: string): Promise<AnalysisResponse> => {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/analysis`)
    return handleResponse<AnalysisResponse>(response)
  },
}
