export interface DocumentResponse {
  id: string
  original_filename: string
  file_type: string
  file_size: number
  processing_status: 'uploaded' | 'processing' | 'ready' | 'failed'
  error_message: string | null
  extracted_character_count: number | null
  page_count: number | null
  upload_timestamp: string
}

