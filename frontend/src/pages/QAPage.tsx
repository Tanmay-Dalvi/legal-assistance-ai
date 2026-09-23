import { FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, LoaderCircle, MessageCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { DocumentAPI } from '../services/api'
import { RAGAPI } from '../services/qaService'
import { DocumentResponse } from '../types/document'
import { QAResponse } from '../types/qa'
import EvidenceCard from '../components/EvidenceCard'
import StatusBadge from '../components/StatusBadge'

export default function QAPage() {
  const { documentId = '' } = useParams()
  const [document, setDocument] = useState<DocumentResponse | null>(null)
  const [indexed, setIndexed] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<QAResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [indexing, setIndexing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([DocumentAPI.getDocument(documentId), RAGAPI.getIndexStatus(documentId)])
      .then(([doc, index]) => { setDocument(doc); setIndexed(index.status === 'ready') })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load this document.'))
  }, [documentId])

  const indexDocument = async () => {
    setIndexing(true); setError(null)
    try { await RAGAPI.indexDocument(documentId); setIndexed(true) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Unable to index this document.') }
    finally { setIndexing(false) }
  }

  const ask = async (event: FormEvent) => {
    event.preventDefault()
    if (!question.trim()) return
    setLoading(true); setError(null)
    try { setAnswer(await RAGAPI.askQuestion(documentId, question.trim())) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Unable to answer this question.') }
    finally { setLoading(false) }
  }

  return (
    <main className="workspace-page">
      <Link to="/" className="btn-ghost mb-6"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to documents</Link>
      {document && <header className="workspace-header"><div className="min-w-0"><p className="eyebrow">Document Q&amp;A</p><h1 className="mt-1 truncate text-3xl font-bold text-slate-900">{document.original_filename}</h1><div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge status={document.processing_status} /><StatusBadge status={indexed ? 'indexed' : 'not-indexed'} /></div></div><div className="flex shrink-0 flex-wrap gap-2"><Link to={`/analyze/${documentId}`} className="btn-secondary">Analysis</Link>{!indexed && <button onClick={indexDocument} disabled={indexing} className="btn-primary">{indexing ? 'Indexing...' : 'Index document'}</button>}</div></header>}
      <section className="workspace-panel mt-8" aria-labelledby="qa-heading"><div className="flex items-start gap-3"><div className="rounded-lg bg-brand-50 p-2 text-brand-700"><MessageCircle className="h-5 w-5" aria-hidden="true" /></div><div><h2 id="qa-heading" className="text-xl font-bold text-slate-900">Ask questions about this document</h2><p className="mt-1 text-sm text-slate-600">Answers use only indexed evidence from the active document.</p></div></div><form onSubmit={ask} className="mt-6 flex flex-col gap-3 sm:flex-row"><label htmlFor="qa-question" className="sr-only">Question about {document?.original_filename || 'this document'}</label><input id="qa-question" className="input" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What obligations does this agreement create?" disabled={!indexed || loading} /><button type="submit" className="btn-primary shrink-0" disabled={!indexed || loading || !question.trim()}>{loading ? 'Asking...' : 'Ask question'}</button></form>{!indexed && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Index this ready document before asking questions.</div>}{error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert">{error}</div>}</section>
      {loading && <div className="mt-6 flex items-center gap-3 rounded-lg bg-slate-50 p-5 text-slate-700" role="status"><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />Searching the document and preparing a grounded answer...</div>}
      {answer && <section className="workspace-panel mt-6" aria-labelledby="answer-heading"><h2 id="answer-heading" className="text-lg font-bold text-slate-900">Answer</h2><p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-800">{answer.answer}</p>{answer.not_found && <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">No supporting information was found in this document.</p>}{answer.evidence.length > 0 && <div className="mt-6"><h3 className="section-kicker">Evidence</h3><div className="mt-3 space-y-3">{answer.evidence.map((evidence, index) => <EvidenceCard key={`${evidence.section_id}-${index}`} evidence={evidence} />)}</div></div>}<p className="mt-6 border-t border-amber-100 pt-4 text-sm text-amber-800">{answer.disclaimer}</p></section>}
    </main>
  )
}
