export type AnalysisStatus = 'pending' | 'processing' | 'ready' | 'failed'
export type Severity = 'low' | 'medium' | 'high'

export interface EvidenceReference {
  section_id: string | null
  page_number: number | null
  heading: string | null
  quote: string
  claim_type: string
}

export interface KeyPoint { point: string; evidence: EvidenceReference[] }
export interface Obligation { party: string | null; obligation: string; evidence: EvidenceReference[] }
export interface ImportantDate { description: string; date: string | null; evidence: EvidenceReference[] }
export interface FinancialTerm { description: string; amount: string | null; evidence: EvidenceReference[] }
export interface TerminationTerm { description: string; evidence: EvidenceReference[] }
export interface RiskItem { description: string; severity: Severity; evidence: EvidenceReference[] }
export interface Inconsistency { description: string; evidence: EvidenceReference[] }
export interface LawyerQuestion { question: string; reason: string | null; evidence: EvidenceReference[] }

export interface LegalAnalysisResult {
  summary: string
  document_type: string
  key_points: KeyPoint[]
  obligations: Obligation[]
  important_dates: ImportantDate[]
  financial_terms: FinancialTerm[]
  termination_terms: TerminationTerm[]
  risks: RiskItem[]
  inconsistencies: Inconsistency[]
  questions_for_lawyer: LawyerQuestion[]
  evidence: EvidenceReference[]
  disclaimer: string
}

export interface AnalysisResponse {
  id: string
  document_id: string
  status: AnalysisStatus
  result: LegalAnalysisResult | null
  error_message: string | null
  created_at: string
  updated_at: string
}
