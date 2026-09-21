import { handleResponse } from './api'
import { IndexResponse, QAResponse } from '../types/qa'
import { API_BASE_URL } from '../utils/constants'

export const RAGAPI = {
  indexDocument: async (documentId: string): Promise<IndexResponse> => {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/index`, { method: 'POST' })
    return handleResponse<IndexResponse>(response)
  },
  getIndexStatus: async (documentId: string): Promise<IndexResponse> => {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/index/status`)
    return handleResponse<IndexResponse>(response)
  },
  askQuestion: async (documentId: string, question: string): Promise<QAResponse> => {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })
    return handleResponse<QAResponse>(response)
  },
}
