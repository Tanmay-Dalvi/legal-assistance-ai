import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, FileSearch, LoaderCircle } from 'lucide-react'
import { useAnalysis } from '../hooks/useAnalysis'
import { EvidenceReference, LegalAnalysisResult, RiskItem } from '../types/analysis'
import { IndexResponse, QAResponse } from '../types/qa'
import { RAGAPI } from '../services/qaService'
import { DocumentAPI } from '../services/api'
import { DocumentResponse } from '../types/document'
import EvidenceCard from '../components/EvidenceCard'
import StatusBadge from '../components/StatusBadge'

function Evidence({ references }: { references: EvidenceReference[] }) {
  if (references.length === 0) return null
  return (
    <div className="mt-3 space-y-2" aria-label="Source references">
      {references.map((reference, index) => <EvidenceCard key={`${reference.section_id}-${index}`} evidence={reference} />)}
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
  const [document, setDocument] = useState<DocumentResponse | null>(null)
  const { analysis, isLoading, error, loadAnalysis, analyze } = useAnalysis(documentId)
  const [index, setIndex] = useState<IndexResponse | null>(null)
  const [indexLoading, setIndexLoading] = useState(false)
  const [indexError, setIndexError] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [qa, setQa] = useState<QAResponse | null>(null)
  const [qaLoading, setQaLoading] = useState(false)
  const [qaError, setQaError] = useState<string | null>(null)

  useEffect(() => {
    DocumentAPI.getDocument(documentId).then(setDocument).catch(() => setDocument(null))
    loadAnalysis().catch(() => undefined)
    RAGAPI.getIndexStatus(documentId).then(setIndex).catch(() => setIndex(null))
  }, [documentId, loadAnalysis])

  const startAnalysis = () => {
    analyze().catch(() => undefined)
  }

  const startIndexing = async () => {
    setIndexLoading(true)
    setIndexError(null)
    try { setIndex(await RAGAPI.indexDocument(documentId)) }
    catch (err: unknown) { setIndexError(err instanceof Error ? err.message : 'Unable to index this document.') }
    finally { setIndexLoading(false) }
  }

  const askQuestion = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!question.trim()) return
    setQaLoading(true)
    setQaError(null)
    try { setQa(await RAGAPI.askQuestion(documentId, question.trim())) }
    catch (err: unknown) { setQaError(err instanceof Error ? err.message : 'Unable to answer this question.') }
    finally { setQaLoading(false) }
  }

  return (
    <main className="workspace-page">
      <Link to="/" className="btn-ghost mb-8"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to documents</Link>
      <header className="workspace-header">
        <div className="min-w-0"><p className="eyebrow">Document analysis</p><h1 className="mt-1 truncate text-3xl font-bold text-slate-900">{document?.original_filename || 'Grounded legal information'}</h1><p className="mt-2 text-slate-600">Findings are based only on the uploaded document and include source references.</p>{document && <div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={document.processing_status} />{index && <StatusBadge status={index.status === 'ready' ? 'indexed' : 'not-indexed'} />}</div>}</div>
        <div className="flex flex-wrap gap-3">
          {(!analysis || analysis.status === 'failed') && <button onClick={startAnalysis} disabled={isLoading} className="btn-primary shrink-0"><FileSearch className="h-4 w-4" aria-hidden="true" />Analyze Document</button>}
          <Link to={`/qa/${documentId}`} className="btn-secondary shrink-0" aria-label="Ask questions about this document">Ask questions</Link><button onClick={startIndexing} disabled={indexLoading || index?.status === 'ready'} className="btn-secondary shrink-0">{indexLoading ? 'Indexing...' : index?.status === 'ready' ? `Indexed (${index.chunk_count})` : 'Index Document'}</button>
        </div>
      </header>
      {isLoading && <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-6 text-slate-700" role="status"><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />Analyzing document. This may take a moment.</div>}
      {error && !isLoading && <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p>{error}</p></div>}
      {!isLoading && !error && analysis?.status === 'ready' && analysis.result && <ResultView result={analysis.result} />}
      {!isLoading && !error && analysis?.status === 'failed' && <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p>{analysis.error_message || 'Analysis failed. Please try again.'}</p></div>}
      {!isLoading && !error && !analysis && <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-600">Start analysis when you are ready.</div>}
      {indexError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert">{indexError}</div>}
      {index?.status === 'failed' && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert">{index.error_message || 'Indexing failed. Please try again.'}</div>}
      <section className="mt-10 border-t border-slate-200 pt-8" aria-labelledby="document-questions">
        <h2 id="document-questions" className="text-xl font-bold text-slate-900">Ask about this document</h2>
        <p className="mt-2 text-sm text-slate-600">Questions are answered only from indexed document evidence.</p>
        <form onSubmit={askQuestion} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="document-question" className="sr-only">Question about the document</label>
          <input id="document-question" value={question} onChange={(event) => setQuestion(event.target.value)} className="input" placeholder="What obligations does this agreement create?" disabled={index?.status !== 'ready' || qaLoading} />
          <button type="submit" className="btn-primary shrink-0" disabled={index?.status !== 'ready' || qaLoading || !question.trim()}>{qaLoading ? 'Asking...' : 'Ask question'}</button>
        </form>
        {qaError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert">{qaError}</div>}
        {qa && <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5"><p className="leading-relaxed text-slate-800">{qa.answer}</p>{qa.not_found && <p className="mt-3 text-sm text-slate-600">No supporting evidence was found.</p>}<Evidence references={qa.evidence} /><p className="mt-4 border-t border-amber-100 pt-3 text-sm text-amber-800">{qa.disclaimer}</p></div>}
      </section>
    </main>
  )
}
