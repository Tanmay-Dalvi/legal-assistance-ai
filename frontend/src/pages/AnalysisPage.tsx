import { useEffect, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, FileSearch, LoaderCircle } from 'lucide-react'
import { useAnalysis } from '../hooks/useAnalysis'
import { EvidenceReference, LegalAnalysisResult, RiskItem } from '../types/analysis'

function Evidence({ references }: { references: EvidenceReference[] }) {
  if (references.length === 0) return null
  return (
    <div className="mt-3 flex flex-wrap gap-2" aria-label="Source references">
      {references.map((reference, index) => (
        <span key={`${reference.section_id}-${index}`} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
          {reference.page_number ? `Page ${reference.page_number}` : reference.heading || reference.section_id || 'Source'}
          <span aria-hidden="true">·</span>
          <span className="max-w-xs truncate">“{reference.quote}”</span>
        </span>
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const sectionId = title.toLowerCase().replace(/ /g, '-')
  return (
    <section className="border-t border-slate-200 py-6" aria-labelledby={sectionId}>
      <h2 id={sectionId} className="text-xl font-bold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Risk({ risk }: { risk: RiskItem }) {
  const severityClass = {
    high: 'border-red-200 bg-red-50 text-red-800',
    medium: 'border-amber-200 bg-amber-50 text-amber-800',
    low: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  }[risk.severity]
  return <li className={`rounded-lg border p-4 ${severityClass}`}><strong className="uppercase text-xs tracking-wide">{risk.severity}</strong><p className="mt-1">{risk.description}</p><Evidence references={risk.evidence} /></li>
}

function ResultView({ result }: { result: LegalAnalysisResult }) {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Executive Summary</p>
        <p className="mt-2 text-lg leading-relaxed text-slate-800">{result.summary}</p>
        <p className="mt-4 text-sm text-slate-600"><strong>Document type:</strong> {result.document_type}</p>
        <Evidence references={result.evidence} />
      </div>
      <Section title="Key Points"><ul className="space-y-3">{result.key_points.map((item, i) => <li key={i} className="rounded-lg bg-slate-50 p-4">{item.point}<Evidence references={item.evidence} /></li>)}</ul></Section>
      <Section title="Obligations"><ul className="space-y-3">{result.obligations.map((item, i) => <li key={i} className="rounded-lg bg-slate-50 p-4">{item.party && <strong>{item.party}: </strong>}{item.obligation}<Evidence references={item.evidence} /></li>)}</ul></Section>
      <Section title="Important Dates"><ul className="space-y-3">{result.important_dates.map((item, i) => <li key={i} className="rounded-lg bg-slate-50 p-4"><strong>{item.date || 'Date not determined'}</strong> {item.description}<Evidence references={item.evidence} /></li>)}</ul></Section>
      <Section title="Financial Terms"><ul className="space-y-3">{result.financial_terms.map((item, i) => <li key={i} className="rounded-lg bg-slate-50 p-4">{item.amount && <strong>{item.amount}: </strong>}{item.description}<Evidence references={item.evidence} /></li>)}</ul></Section>
      <Section title="Termination Terms"><ul className="space-y-3">{result.termination_terms.map((item, i) => <li key={i} className="rounded-lg bg-slate-50 p-4">{item.description}<Evidence references={item.evidence} /></li>)}</ul></Section>
      <Section title="Risks"><ul className="space-y-3">{result.risks.map((risk, i) => <Risk key={i} risk={risk} />)}</ul></Section>
      <Section title="Inconsistencies"><ul className="space-y-3">{result.inconsistencies.map((item, i) => <li key={i} className="rounded-lg bg-slate-50 p-4">{item.description}<Evidence references={item.evidence} /></li>)}</ul></Section>
      <Section title="Questions for a Lawyer"><ul className="space-y-3">{result.questions_for_lawyer.map((item, i) => <li key={i} className="rounded-lg bg-slate-50 p-4"><strong>{item.question}</strong>{item.reason && <p className="mt-1 text-slate-600">{item.reason}</p>}<Evidence references={item.evidence} /></li>)}</ul></Section>
      <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" aria-label="Legal information disclaimer">{result.disclaimer}</section>
    </div>
  )
}

export default function AnalysisPage() {
  const { documentId = '' } = useParams()
  const { analysis, isLoading, error, loadAnalysis, analyze } = useAnalysis(documentId)

  useEffect(() => {
    loadAnalysis().catch(() => undefined)
  }, [loadAnalysis])

  const startAnalysis = () => {
    analyze().catch(() => undefined)
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/" className="btn-ghost mb-8"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to documents</Link>
      <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-medium uppercase tracking-wide text-brand-600">Document analysis</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Grounded legal information</h1><p className="mt-2 text-slate-600">Findings are based only on the uploaded document and include source references.</p></div>
        {(!analysis || analysis.status === 'failed') && <button onClick={startAnalysis} disabled={isLoading} className="btn-primary shrink-0"><FileSearch className="h-4 w-4" aria-hidden="true" />Analyze Document</button>}
      </header>
      {isLoading && <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-6 text-slate-700" role="status"><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />Analyzing document. This may take a moment.</div>}
      {error && !isLoading && <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p>{error}</p></div>}
      {!isLoading && !error && analysis?.status === 'ready' && analysis.result && <ResultView result={analysis.result} />}
      {!isLoading && !error && analysis?.status === 'failed' && <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p>{analysis.error_message || 'Analysis failed. Please try again.'}</p></div>}
      {!isLoading && !error && !analysis && <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-600">Start analysis when you are ready.</div>}
    </main>
  )
}
