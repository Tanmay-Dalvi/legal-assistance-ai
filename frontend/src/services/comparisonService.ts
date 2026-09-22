import { handleResponse } from './api'
import { ComparisonResponse } from '../types/comparison'
import { API_BASE_URL } from '../utils/constants'

export const ComparisonAPI = {
  compare: async (documentAId: string, documentBId: string): Promise<ComparisonResponse> => {
    const response = await fetch(`${API_BASE_URL}/comparisons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_a_id: documentAId, document_b_id: documentBId }),
    })
    return handleResponse<ComparisonResponse>(response)
  },
  get: async (comparisonId: string): Promise<ComparisonResponse> => {
    const response = await fetch(`${API_BASE_URL}/comparisons/${comparisonId}`)
    return handleResponse<ComparisonResponse>(response)
  },
}
