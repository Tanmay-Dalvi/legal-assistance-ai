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
