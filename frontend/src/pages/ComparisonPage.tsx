import { useEffect, useState } from 'react'
import { ArrowLeft, GitCompare, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DocumentAPI } from '../services/api'
import { ComparisonAPI } from '../services/comparisonService'
import { ComparisonChange, ComparisonResponse } from '../types/comparison'
import { DocumentResponse } from '../types/document'

function Evidence({ change }: { change: ComparisonChange }) {
  return (
    <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
      {[['Document A', change.evidence_a], ['Document B', change.evidence_b]].map(([label, references]) => (
        <div key={label as string} className="rounded-md bg-slate-100 p-2 text-slate-600">
          <strong>{label as string}</strong>
          {(references as ComparisonChange['evidence_a']).map((reference, index) => (
            <p key={index} className="mt-1">{reference.page_number ? `Page ${reference.page_number}` : reference.heading || reference.section_id}: “{reference.quote}”</p>
          ))}
        </div>
      ))}
    </div>
  )
}

function ChangeCard({ change, status }: { change: ComparisonChange; status: 'ADDED' | 'REMOVED' | 'MODIFIED' }) {
  const color = status === 'ADDED' ? 'border-emerald-200 bg-emerald-50' : status === 'REMOVED' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
  return <article className={`rounded-lg border p-4 ${color}`}><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold tracking-wide">{status}</span><span className="text-xs uppercase text-slate-600">{change.category}</span></div><h3 className="mt-2 font-semibold text-slate-900">{change.title}</h3><p className="mt-1 text-slate-700">{change.description}</p>{(change.document_a_value || change.document_b_value) && <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-md bg-white/70 p-3"><p className="text-xs font-semibold text-slate-500">DOCUMENT A</p><p className="mt-1 whitespace-pre-wrap text-sm">{change.document_a_value || 'Not present'}</p></div><div className="rounded-md bg-white/70 p-3"><p className="text-xs font-semibold text-slate-500">DOCUMENT B</p><p className="mt-1 whitespace-pre-wrap text-sm">{change.document_b_value || 'Not present'}</p></div></div>}<Evidence change={change} /></article>
}

export default function ComparisonPage() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([])
  const [documentA, setDocumentA] = useState('')
  const [documentB, setDocumentB] = useState('')
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { DocumentAPI.listDocuments().then(setDocuments).catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load documents.')) }, [])

  const runComparison = async () => {
    setLoading(true); setError(null)
    try { setComparison(await ComparisonAPI.compare(documentA, documentB)) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Unable to compare these documents.') }
    finally { setLoading(false) }
  }

  const result = comparison?.result
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <Link to="/" className="btn-ghost mb-8"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to documents</Link>
    <header className="mb-8"><p className="text-sm font-medium uppercase tracking-wide text-brand-600">Document comparison</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Compare two legal documents</h1><p className="mt-2 text-slate-600">Differences are grounded in the extracted text of both documents.</p></header>
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="comparison-selectors"><h2 id="comparison-selectors" className="text-lg font-bold text-slate-900">Choose documents</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="label">Document A<select value={documentA} onChange={(event) => setDocumentA(event.target.value)} className="input mt-1"><option value="">Select a ready document</option>{documents.filter((doc) => doc.processing_status === 'ready').map((doc) => <option key={doc.id} value={doc.id}>{doc.original_filename}</option>)}</select></label><label className="label">Document B<select value={documentB} onChange={(event) => setDocumentB(event.target.value)} className="input mt-1"><option value="">Select a different ready document</option>{documents.filter((doc) => doc.processing_status === 'ready' && doc.id !== documentA).map((doc) => <option key={doc.id} value={doc.id}>{doc.original_filename}</option>)}</select></label></div><button onClick={runComparison} disabled={!documentA || !documentB || documentA === documentB || loading} className="btn-primary mt-5"><GitCompare className="h-4 w-4" aria-hidden="true" />{loading ? 'Comparing...' : 'Compare documents'}</button></section>
    {loading && <div className="mt-6 flex items-center gap-3 rounded-lg bg-slate-50 p-5" role="status"><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />Comparing aligned sections. This may take a moment.</div>}
    {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert">{error}</div>}
    {result && <div className="mt-8 space-y-6"><section className="rounded-xl border border-brand-200 bg-brand-50 p-6"><p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Executive Summary</p><p className="mt-2 text-lg leading-relaxed text-slate-800">{result.executive_summary}</p><p className="mt-3 text-sm text-slate-600"><strong>Document A:</strong> {result.document_a_label} <span className="mx-2">|</span><strong>Document B:</strong> {result.document_b_label}</p></section><section><h2 className="text-xl font-bold text-slate-900">Unchanged Sections</h2><p className="mt-2 text-slate-700">{result.unchanged_sections.length ? result.unchanged_sections.join(' · ') : 'None identified.'}</p></section>{[['Added Sections', result.added_sections, 'ADDED'], ['Removed Sections', result.removed_sections, 'REMOVED'], ['Modified Sections', [...result.modified_sections, ...result.obligation_changes, ...result.financial_changes, ...result.date_changes, ...result.termination_changes, ...result.risk_relevant_changes], 'MODIFIED']].map(([title, changes, status]) => <section key={title as string}><h2 className="text-xl font-bold text-slate-900">{title as string}</h2><div className="mt-3 space-y-3">{(changes as ComparisonChange[]).length ? (changes as ComparisonChange[]).map((change, index) => <ChangeCard key={index} change={change} status={status as 'ADDED' | 'REMOVED' | 'MODIFIED'} />) : <p className="text-slate-600">None identified.</p>}</div></section>)}<section><h2 className="text-xl font-bold text-slate-900">Questions for a Lawyer</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">{result.questions_for_lawyer.length ? result.questions_for_lawyer.map((question, index) => <li key={index}>{question}</li>) : <li>None identified.</li>}</ul></section><p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{result.disclaimer}</p></div>}
  </main>
}
