import { FormEvent, useEffect, useState, useRef } from 'react'
import { ArrowLeft, LoaderCircle, MessageCircle, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { DocumentAPI } from '../services/api'
import { RAGAPI } from '../services/qaService'
import { DocumentResponse } from '../types/document'
import { EvidenceReference } from '../types/analysis'
import EvidenceCard from '../components/EvidenceCard'
import StatusBadge from '../components/StatusBadge'

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  evidence?: EvidenceReference[];
  disclaimer?: string;
  not_found?: boolean;
}

export default function QAPage() {
  const { documentId = '' } = useParams()
  const [document, setDocument] = useState<DocumentResponse | null>(null)
  const [indexed, setIndexed] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [indexing, setIndexing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load document status and initial history when documentId changes
  useEffect(() => {
    // Reset transient state when switching documents
    setDocument(null);
    setIndexed(false);
    setError(null);
    setQuestion('');
    setLoading(false);
    
    // Load local history immediately to prevent flicker
    const stored = localStorage.getItem(`legalai_chat_history_${documentId}`);
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }

    Promise.all([DocumentAPI.getDocument(documentId), RAGAPI.getIndexStatus(documentId)])
      .then(([doc, index]) => { 
        setDocument(doc); 
        setIndexed(index.status === 'ready') 
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load this document.'))
  }, [documentId])

  const updateMessages = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    localStorage.setItem(`legalai_chat_history_${documentId}`, JSON.stringify(newMessages));
  };

  // Scroll to bottom when messages or loading change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const indexDocument = async () => {
    setIndexing(true); setError(null)
    try { await RAGAPI.indexDocument(documentId); setIndexed(true) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Unable to index this document.') }
    finally { setIndexing(false) }
  }

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history for this document?")) {
      updateMessages([]);
    }
  };

  const ask = async (event: FormEvent) => {
    event.preventDefault()
    const currentQ = question.trim()
    if (!currentQ) return
    
    // Optimistically add user message
    const userMsgId = Date.now().toString() + '-user'
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: currentQ
    }
    
    // We append locally first
    const newMessagesAfterUser = [...messages, userMessage];
    updateMessages(newMessagesAfterUser);
    
    setQuestion('') // clear input immediately
    setLoading(true); 
    setError(null)
    
    try { 
      const response = await RAGAPI.askQuestion(documentId, currentQ) 
      const assistantMsg: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        content: response.answer,
        evidence: response.evidence,
        disclaimer: response.disclaimer,
        not_found: response.not_found
      }
      updateMessages([...newMessagesAfterUser, assistantMsg]);
    } catch (err: unknown) { 
      const errorMsg: ChatMessage = {
        id: Date.now().toString() + '-error',
        role: 'error',
        content: err instanceof Error ? err.message : 'Unable to answer this question.'
      }
      updateMessages([...newMessagesAfterUser, errorMsg]);
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <main className="workspace-page">
      <Link to="/" className="btn-ghost mb-6"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to documents</Link>
      {document && (
        <header className="workspace-header">
          <div className="min-w-0">
            <p className="eyebrow">Document Q&amp;A</p>
            <h1 className="mt-1 truncate text-3xl font-bold text-slate-900">{document.original_filename}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={document.processing_status} />
              <StatusBadge status={indexed ? 'indexed' : 'not-indexed'} />
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {messages.length > 0 && (
              <button onClick={clearChat} className="btn-ghost flex items-center gap-2 text-slate-500 hover:text-slate-700 mr-2">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Clear chat
              </button>
            )}
            <Link to={`/analyze/${documentId}`} className="btn-secondary">Analysis</Link>
            {!indexed && (
              <button onClick={indexDocument} disabled={indexing} className="btn-primary">
                {indexing ? 'Indexing...' : 'Index document'}
              </button>
            )}
          </div>
        </header>
      )}

      {/* Chat History Section */}
      <div className="mt-8 space-y-6">
        {messages.map(msg => (
          <section key={msg.id} className="workspace-panel overflow-visible break-words" aria-labelledby={`msg-${msg.id}`}>
            {msg.role === 'user' && (
              <div>
                <h2 id={`msg-${msg.id}`} className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">User</h2>
                <p className="text-lg font-medium text-slate-900">{msg.content}</p>
              </div>
            )}
            {msg.role === 'assistant' && (
              <div>
                <h2 id={`msg-${msg.id}`} className="text-sm font-bold text-brand-600 uppercase tracking-wider mb-2">Assistant</h2>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-800">{msg.content || (msg.not_found ? "The information was not found in the document." : "")}</p>
                {msg.not_found && !msg.content && (
                  <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">No supporting information was found in this document.</p>
                )}
                {msg.evidence && msg.evidence.length > 0 && (
                  <div className="mt-6">
                    <h3 className="section-kicker">Evidence</h3>
                    <div className="mt-3 space-y-3">
                      {msg.evidence.map((ev, index) => <EvidenceCard key={`${ev.section_id || 'no-section'}-${index}`} evidence={ev} />)}
                    </div>
                  </div>
                )}
                {msg.disclaimer && (
                  <p className="mt-6 border-t border-amber-100 pt-4 text-sm text-amber-800">{msg.disclaimer}</p>
                )}
              </div>
            )}
            {msg.role === 'error' && (
              <div>
                <h2 id={`msg-${msg.id}`} className="text-sm font-bold text-red-600 uppercase tracking-wider mb-2">Error</h2>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert">{msg.content}</div>
              </div>
            )}
          </section>
        ))}

        {loading && (
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-5 text-slate-700" role="status">
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            Searching the document and preparing a grounded answer...
          </div>
        )}
      </div>

      <section className="workspace-panel mt-6 mb-12" aria-labelledby="qa-heading">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-brand-50 p-2 text-brand-700">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="qa-heading" className="text-xl font-bold text-slate-900">Ask questions about this document</h2>
            <p className="mt-1 text-sm text-slate-600">Answers use only indexed evidence from the active document.</p>
          </div>
        </div>
        <form onSubmit={ask} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="qa-question" className="sr-only">Question about {document?.original_filename || 'this document'}</label>
          <input 
            id="qa-question" 
            className="input" 
            value={question} 
            onChange={(event) => setQuestion(event.target.value)} 
            placeholder="What obligations does this agreement create?" 
            disabled={!indexed || loading} 
          />
          <button type="submit" className="btn-primary shrink-0" disabled={!indexed || loading || !question.trim()}>
            {loading ? 'Asking...' : 'Ask question'}
          </button>
        </form>
        {!indexed && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Index this ready document before asking questions.
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
            {error}
          </div>
        )}
      </section>
      <div ref={messagesEndRef} />
    </main>
  )
}
