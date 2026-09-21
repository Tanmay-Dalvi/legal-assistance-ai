import { ApiError } from '../types/api'
import { DocumentResponse } from '../types/document'
import { API_BASE_URL } from '../utils/constants'

class ApiClientError extends Error {
  public data: ApiError | null

  constructor(message: string, data: ApiError | null = null) {
    super(message)
    this.name = 'ApiClientError'
    this.data = data
  }
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiError | null = null
    try {
      errorData = await response.json()
    } catch {
      // Ignore
    }
    
    if (errorData?.error?.message) {
      throw new ApiClientError(errorData.error.message, errorData)
    }
    throw new ApiClientError(`Request failed with status ${response.status}`)
  }
  
  if (response.status === 204) {
    return null as unknown as T
  }
  
  return response.json()
}

export const DocumentAPI = {
  uploadDocument: async (file: File): Promise<DocumentResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const res = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    })
    return handleResponse<DocumentResponse>(res)
  },
  
  listDocuments: async (): Promise<DocumentResponse[]> => {
    const res = await fetch(`${API_BASE_URL}/documents`)
    return handleResponse<DocumentResponse[]>(res)
  },
  
  getDocument: async (id: string): Promise<DocumentResponse> => {
    const res = await fetch(`${API_BASE_URL}/documents/${id}`)
    return handleResponse<DocumentResponse>(res)
  },
  
  deleteDocument: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'DELETE',
    })
    return handleResponse<void>(res)
  }
}
