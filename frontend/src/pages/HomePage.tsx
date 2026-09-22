import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  FileText,
  GitCompare,
  MessageSquare,
  ShieldAlert,
  ListChecks,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  Scale,
  Trash2,
  File as FileIcon,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import DocumentUploader from '../components/DocumentUploader'
import { DocumentAPI } from '../services/api'
import { DocumentResponse } from '../types/document'
import LoadingSpinner from '../components/LoadingSpinner'

// ... (KEEP FEATURES AND HOW_IT_WORKS FROM PREVIOUS)
const FEATURES = [
  {
    icon: FileText,
    title: 'Document Analysis',
    description: 'Upload a contract, agreement, or legal document. Get a structured summary highlighting key parties, dates, obligations, and terms.',
    color: 'bg-blue-50 text-blue-600',
    soon: true,
  },
  {
    icon: ShieldAlert,
    title: 'Risk & Clause Detection',
    description: 'Automatically identify potentially unfavourable clauses, hidden obligations, penalty conditions, and red-flag language.',
    color: 'bg-red-50 text-red-600',
    soon: true,
  },
  {
    icon: GitCompare,
    title: 'Document Comparison',
    description: 'Compare two versions of a document and get a clear breakdown of meaningful differences, added obligations, and removed protections.',
    color: 'bg-violet-50 text-violet-600',
    soon: true,
  },
  {
    icon: MessageSquare,
    title: 'Grounded Q&A',
    description: 'Ask specific questions about your uploaded documents. Every answer is grounded in the actual document text with citations.',
    color: 'bg-emerald-50 text-emerald-600',
    soon: true,
  },
  {
    icon: ListChecks,
    title: 'Actionable Checklists',
    description: 'Receive a prioritised checklist of actions, deadlines, and items to review or clarify with a legal professional.',
    color: 'bg-amber-50 text-amber-600',
    soon: true,
  },
  {
    icon: Lightbulb,
    title: 'Plain-Language Explanations',
    description: 'Complex legal jargon translated into clear, accessible language. Understand what you are agreeing to.',
    color: 'bg-cyan-50 text-cyan-600',
    soon: true,
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload Your Document',
    description: 'Upload a PDF, Word document, or plain-text file. Your document is processed securely and never shared.',
    icon: FileText,
  },
  {
    step: '02',
    title: 'AI Analyses the Content',
    description: 'Gemini AI reads and analyses the document, identifying key sections, obligations, risks, and terms.',
    icon: Scale,
  },
  {
    step: '03',
    title: 'Review Grounded Insights',
    description: 'Receive structured analysis with direct citations to the source document. Ask follow-up questions as needed.',
    icon: MessageSquare,
  },
  {
    step: '04',
    title: 'Prepare for Professional Review',
    description: 'Use the generated checklist and questions to have a more informed, efficient conversation with a legal professional.',
    icon: ListChecks,
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<DocumentResponse[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await DocumentAPI.listDocuments()
      setDocuments(docs)
    } catch (e) {
      console.error('Failed to load documents:', e)
    } finally {
      setIsLoadingDocs(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return
    setIsDeleting(id)
    try {
      await DocumentAPI.deleteDocument(id)
      setDocuments(docs => docs.filter(d => d.id !== id))
    } catch (e) {
      alert('Failed to delete document.')
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 text-white"
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                            bg-white/10 border border-white/20 text-sm font-medium mb-8">
              <Scale className="w-4 h-4" aria-hidden="true" />
              AI-Powered Legal Information Platform
            </div>

            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-balance mb-6"
            >
              Understand Your{' '}
              <span className="text-legal-300">Legal Documents</span>{' '}
              with Confidence
            </h1>

            <p className="text-lg sm:text-xl text-brand-100 leading-relaxed mb-10 max-w-2xl text-balance">
              Upload contracts, agreements, or legal notices. Get plain-language summaries,
              risk identification, and grounded answers — all backed by direct citations from
              your document.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#upload-section"
                className="btn-primary bg-white text-brand-700 hover:bg-brand-50 text-base px-6 py-3"
              >
                Upload a Document
              </a>
              <a
                href="#how-it-works"
                className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20 text-base px-6 py-3"
              >
                How It Works
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section aria-label="Legal disclaimer" className="bg-amber-50 border-y border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> LegalAI provides legal <em>information</em> and document
              analysis to help you better understand your documents. It does{' '}
              <strong>not</strong> provide legal advice and is not a substitute for a qualified
              legal professional.
            </p>
          </div>
        </div>
      </section>

      {/* Workspace / Upload Section */}
      <section id="upload-section" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Your Workspace</h2>
            <p className="text-slate-600">Upload a legal document to extract text and prepare for analysis.</p>
          </div>
          
          <DocumentUploader onUploadSuccess={() => loadDocuments()} />
          <div className="mt-6 flex justify-end">
            <a href="/compare" className="btn-secondary">Compare two documents</a>
          </div>
          
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Document Library</h3>
              <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {documents.length} files
              </span>
            </div>
            
            {isLoadingDocs ? (
              <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <FileIcon className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No documents yet</p>
                <p className="text-sm text-slate-500 mt-1">Upload your first document above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map(doc => (
                  <div key={doc.id} className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-3 bg-brand-50 text-brand-600 rounded-lg shrink-0">
                        <FileIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate" title={doc.original_filename}>
                          {doc.original_filename}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                          <span className="uppercase font-medium tracking-wide">{doc.file_type}</span>
                          <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                          <span>{new Date(doc.upload_timestamp).toLocaleDateString()}</span>
                          {doc.page_count && <span>{doc.page_count} pages</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 border-t border-slate-100 sm:border-0 pt-4 sm:pt-0 mt-4 sm:mt-0">
                      {doc.processing_status === 'ready' && (
                        <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Extracted
                        </div>
                      )}
                      {doc.processing_status === 'failed' && (
                        <div className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2.5 py-1 rounded-full text-xs font-medium" title={doc.error_message || 'Unknown error'}>
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </div>
                      )}
                      {doc.processing_status === 'processing' && (
                        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-medium">
                          <Clock className="w-3.5 h-3.5 animate-pulse" /> Processing
                        </div>
                      )}
                      
                      <div className="flex gap-2 ml-auto sm:ml-0">
                        <button 
                          className="btn-secondary !px-3 !py-1.5 text-xs"
                          disabled={doc.processing_status !== 'ready'}
                          onClick={() => navigate(`/analyze/${doc.id}`)}
                        >
                          Analyze
                        </button>
                        <button 
                          className="btn-ghost !p-2 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(doc.id)}
                          disabled={isDeleting === doc.id}
                          aria-label="Delete document"
                        >
                          {isDeleting === doc.id ? <LoadingSpinner size="sm" showLabel={false} /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Features Grid */}
      <section
        aria-labelledby="features-heading"
        className="py-20 sm:py-24 bg-slate-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              id="features-heading"
              className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
            >
              Everything You Need to Navigate Legal Documents
            </h2>
            <p className="text-lg text-slate-600 text-balance">
              A comprehensive toolkit to help you understand, analyse, and prepare
              before you sign or act on any legal document.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description, color, soon }) => (
              <article
                key={title}
                className="card p-6 hover:shadow-md transition-shadow duration-200 group"
              >
                <div
                  className={`inline-flex p-3 rounded-xl ${color} mb-4 group-hover:scale-105 transition-transform duration-150`}
                  aria-hidden="true"
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  {soon && (
                    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide
                                     bg-brand-50 text-brand-600 px-2 py-1 rounded-full">
                      Soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="py-20 sm:py-24 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              id="how-heading"
              className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
            >
              How LegalAI Works
            </h2>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" role="list">
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }) => (
              <li key={step} className="relative flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-200">
                    <Icon className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-2 border-brand-200 text-brand-700 text-xs font-bold flex items-center justify-center shadow-sm">
                    {step}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
