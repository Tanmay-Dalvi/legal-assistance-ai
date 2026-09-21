# Legal Assistance AI

LegalAI helps users understand uploaded legal documents through structured document analysis. It provides legal information and document analysis, not legal advice, and is not a substitute for a qualified legal professional.

## Gemini configuration

Live analysis uses the official `google-genai` SDK. Copy `.env.example` to `.env` and set:

- `GEMINI_API_KEY`: Google AI Studio API key, required for live analysis.
- `GEMINI_MODEL`: Gemini model name, default `gemini-1.5-pro`.
- `GEMINI_TIMEOUT_SECONDS`: Gemini request timeout, default `60`.
- `GEMINI_MAX_RETRIES`: bounded transient-failure retries, default `2`.
- `MAX_ANALYSIS_CHARACTERS`: direct-analysis input limit, default `100000`.

The application starts and the automated tests run without a Gemini key. Analysis requests return a structured unavailable response until a key is configured.

## Start locally

Backend:

```bash
cd backend
.venv/bin/python -m uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend uses the Vite development proxy to reach the backend at `http://localhost:8000`.

## Tests and build

```bash
cd backend
.venv/bin/python -m pytest -q

cd ../frontend
npm run build
```

Analysis currently sends only documents within the configured direct-analysis limit. Chunking, embeddings, semantic retrieval, and comparison are reserved for later milestones.

## RAG and document Q&A

The RAG foundation keeps extracted content as the source of truth, splits it into deterministic sentence-aware chunks with page and section provenance, and generates Gemini embeddings in bounded batches. A per-document JSON vector index is stored locally under `backend/data/vector_index/`; SQLite stores index status and chunk metadata. These generated files are ignored by Git and must not be committed.

Index a ready document from the analysis page or with `POST /api/v1/documents/{document_id}/index`. Retrieval is restricted to that document and applies a configurable similarity threshold before chunks are passed to Gemini. Questions use `POST /api/v1/documents/{document_id}/qa` and return only validated source references, or an explicit not-found response when evidence is insufficient.

RAG configuration includes `RAG_CHUNK_SIZE`, `RAG_CHUNK_OVERLAP`, `RAG_EMBEDDING_BATCH_SIZE`, `RAG_TOP_K`, and `RAG_MIN_SIMILARITY`. Gemini access is required for indexing and answered questions. This implementation is local-first and synchronous; OCR, background workers, embeddings caches, and remote vector databases are outside this milestone.
