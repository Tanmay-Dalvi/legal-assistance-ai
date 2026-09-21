import { EvidenceReference } from './analysis'

export interface IndexResponse {
  id: string
  document_id: string
  status: 'pending' | 'processing' | 'ready' | 'failed'
  chunk_count: number
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface QAResponse {
  answer: string
  evidence: EvidenceReference[]
  disclaimer: string
  not_found: boolean
}
