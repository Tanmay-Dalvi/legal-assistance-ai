import { EvidenceReference } from './analysis'

export type ComparisonStatus = 'pending' | 'processing' | 'ready' | 'failed'
export type ChangeCategory = 'section' | 'obligation' | 'financial' | 'date' | 'termination' | 'risk'
export type ChangeSeverity = 'low' | 'medium' | 'high'

export interface ComparisonChange {
  category: ChangeCategory
  title: string
  description: string
  document_a_value: string | null
  document_b_value: string | null
  significance: ChangeSeverity | null
  evidence_a: EvidenceReference[]
  evidence_b: EvidenceReference[]
}

export interface ComparisonResult {
  executive_summary: string
  document_a_label: string
  document_b_label: string
  unchanged_sections: string[]
  added_sections: ComparisonChange[]
  removed_sections: ComparisonChange[]
  modified_sections: ComparisonChange[]
  obligation_changes: ComparisonChange[]
  financial_changes: ComparisonChange[]
  date_changes: ComparisonChange[]
  termination_changes: ComparisonChange[]
  risk_relevant_changes: ComparisonChange[]
  questions_for_lawyer: string[]
  evidence: EvidenceReference[]
  disclaimer: string
}

export interface ComparisonResponse {
  id: string
  document_a_id: string
  document_b_id: string
  status: ComparisonStatus
  result: ComparisonResult | null
  error_message: string | null
  created_at: string
  completed_at: string | null
  updated_at: string
}
