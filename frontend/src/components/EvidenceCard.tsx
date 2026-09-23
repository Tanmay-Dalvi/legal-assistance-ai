import { useState } from 'react'
import { ChevronDown, FileText } from 'lucide-react'
import { EvidenceReference } from '../types/analysis'

interface EvidenceCardProps {
  evidence: EvidenceReference
  documentLabel?: string
}

export default function EvidenceCard({ evidence, documentLabel }: EvidenceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const source = [
    evidence.page_number ? `Page ${evidence.page_number}` : null,
    evidence.heading || evidence.section_id ? [evidence.heading, evidence.section_id].filter(Boolean).join(' · ') : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="evidence-card">
      <button type="button" className="flex w-full items-start gap-3 text-left" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">{documentLabel || 'Source'}{evidence.claim_type ? ` · ${evidence.claim_type}` : ''}</span>
          <span className="mt-1 block text-sm font-medium text-slate-700">{source || 'Source reference'}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {expanded && <blockquote className="mt-3 border-l-2 border-brand-300 pl-3 text-sm leading-relaxed text-slate-600">“{evidence.quote}”</blockquote>}
    </div>
  )
}
