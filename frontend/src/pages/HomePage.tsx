import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, FileText, GitCompare, MessageCircle, Search, Trash2, UploadCloud } from 'lucide-react'
import { Link } from 'react-router-dom'
import DocumentUploader from '../components/DocumentUploader'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { DocumentAPI } from '../services/api'
import { RAGAPI } from '../services/qaService'
import { DocumentResponse } from '../types/document'

interface IndexState { status: 'ready' | 'not-indexed' | 'processing' | 'failed'; chunk_count?: number }

function displayIndexStatus(status: string): IndexState['status'] {
  if (status === 'ready' || status === 'processing' || status === 'failed') return status
  return 'not-indexed'
}

export default function HomePage() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([])
  const [indexStates, setIndexStates] = useState<Record<string, IndexState>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  const loadDocuments = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const loaded = await DocumentAPI.listDocuments()
      setDocuments(loaded)
      const ready = loaded.filter((document) => document.processing_status === 'ready')
      const statuses = await Promise.all(ready.map(async (document) => {
        try {
          const index = await RAGAPI.getIndexStatus(document.id)
          return [document.id, { status: displayIndexStatus(index.status), chunk_count: index.chunk_count }] as const
        } catch { return [document.id, { status: 'not-indexed' }] as const }
      }))
      setIndexStates(Object.fromEntries(statuses))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load your documents.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  const deleteDocument = async (id: string) => {
    setDeleting(id); setError(null)
    try { await DocumentAPI.deleteDocument(id); setDocuments((current) => current.filter((document) => document.id !== id)); setConfirming(null) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Unable to delete this document.') }
    finally { setDeleting(null) }
  }

  const readyDocuments = documents.filter((document) => document.processing_status === 'ready')
  const indexedCount = Object.values(indexStates).filter((state) => state.status === 'ready').length

  return (
    <div className="animate-fade-in">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl"><p className="eyebrow">Legal workspace</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Understand before you act.</h1><p className="mt-3 text-lg leading-relaxed text-slate-600">Upload documents, inspect grounded findings, ask evidence-backed questions, and compare versions in one place.</p></div>
            <a href="#upload-section" className="btn-primary shrink-0"><UploadCloud className="h-4 w-4" aria-hidden="true" />Upload document</a>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="metric-card"><span>Total documents</span><strong>{documents.length}</strong></div><div className="metric-card"><span>Ready</span><strong>{readyDocuments.length}</strong></div><div className="metric-card"><span>Indexed</span><strong>{indexedCount}</strong></div><div className="metric-card"><span>Needs attention</span><strong>{documents.filter((document) => document.processing_status === 'failed').length}</strong></div></div>
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section id="upload-section" className="workspace-panel order-2 lg:order-1" aria-labelledby="documents-heading">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow">Your files</p><h2 id="documents-heading" className="mt-1 text-2xl font-bold text-slate-900">Document library</h2></div>{readyDocuments.length >= 2 && <Link to="/compare" className="btn-secondary"><GitCompare className="h-4 w-4" aria-hidden="true" />Compare documents</Link>}</div>
            <div className="mt-6"><DocumentUploader onUploadSuccess={loadDocuments} /></div>
            {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</div>}
            {loading ? <div className="flex justify-center py-14" role="status"><LoadingSpinner /></div> : documents.length === 0 ? <div className="empty-state"><FileText className="h-8 w-8 text-slate-400" aria-hidden="true" /><h3 className="mt-3 font-semibold text-slate-900">No documents yet</h3><p className="mt-1 text-sm text-slate-600">Upload a legal document to begin.</p></div> : <div className="mt-6 divide-y divide-slate-200">{documents.map((document) => { const index = indexStates[document.id]; const ready = document.processing_status === 'ready'; return <article key={document.id} className="py-5 first:pt-0 last:pb-0"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex min-w-0 items-start gap-3"><div className="rounded-lg bg-brand-50 p-3 text-brand-700"><FileText className="h-5 w-5" aria-hidden="true" /></div><div className="min-w-0"><h3 className="truncate font-semibold text-slate-900" title={document.original_filename}>{document.original_filename}</h3><p className="mt-1 text-xs text-slate-500">{document.file_type.toUpperCase()} · {(document.file_size / 1024 / 1024).toFixed(2)} MB · {new Date(document.upload_timestamp).toLocaleDateString()}{document.page_count ? ` · ${document.page_count} pages` : ''}</p><div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={document.processing_status} />{ready && <StatusBadge status={index?.status || 'not-indexed'} />}</div></div></div><div className="flex flex-wrap items-center gap-2 xl:justify-end"><Link to={`/analyze/${document.id}`} className="btn-secondary !px-3 !py-2 text-xs" aria-label={`Analyze ${document.original_filename}`}><Search className="h-3.5 w-3.5" aria-hidden="true" />Analyze</Link>{ready && index?.status === 'ready' && <Link to={`/qa/${document.id}`} className="btn-secondary !px-3 !py-2 text-xs"><MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />Ask</Link>}<button type="button" className="btn-ghost !p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => setConfirming(document.id)} disabled={deleting === document.id} aria-label={`Delete ${document.original_filename}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div></div>{confirming === document.id && <div className="mt-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between"><span>Delete this document and its analysis/index data?</span><div className="flex gap-2"><button type="button" className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => setConfirming(null)}>Cancel</button><button type="button" className="btn-primary !bg-red-700 !px-3 !py-1.5 text-xs" onClick={() => deleteDocument(document.id)} disabled={deleting === document.id}>{deleting === document.id ? 'Deleting...' : 'Delete'}</button></div></div>}</article> })}</div>}
          </section>
          <aside className="order-1 space-y-4 lg:order-2"><section className="workspace-panel"><p className="eyebrow">Workflow</p><h2 className="mt-1 text-lg font-bold text-slate-900">From upload to insight</h2><ol className="mt-4 space-y-4 text-sm">{[['01', 'Upload', 'Add a PDF, DOCX, or TXT file.'], ['02', 'Analyze', 'Review structured findings and evidence.'], ['03', 'Index', 'Build the document search index.'], ['04', 'Ask', 'Get answers grounded in source text.']].map(([number, title, description]) => <li key={number} className="flex gap-3"><span className="font-mono text-xs font-bold text-brand-600">{number}</span><span><strong className="block text-slate-800">{title}</strong><span className="text-slate-500">{description}</span></span></li>)}</ol></section><section className="disclaimer-banner"><span className="text-sm">LegalAI provides legal information and document analysis, not legal advice. Consult a qualified professional for advice specific to your situation.</span></section><Link to="/compare" className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-900 p-4 text-white transition hover:bg-slate-800"><span><strong className="block">Compare versions</strong><span className="text-xs text-slate-300">Find supported changes across two ready files.</span></span><ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></aside>
        </div>
      </main>
    </div>
  )
}
