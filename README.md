# LegalAI

LegalAI is a GenAI-powered legal document workspace that simplifies the review and comprehension of complex legal agreements.

## Problem
Legal documents are notoriously difficult to understand and navigate. They are filled with dense jargon, scattered obligations, and hidden risks, making it time-consuming and expensive for non-lawyers to review contracts or find critical terms.

## Solution
LegalAI acts as an intelligent legal document workspace. By leveraging GenAI, it instantly processes uploaded documents, extracts key information, highlights risks, and provides a conversational interface for users to interrogate their contracts in plain language.

## Key Features
- **Document upload and extraction:** Seamlessly ingest PDF, DOCX, and TXT files.
- **AI legal document analysis:** Automatically generate structured insights from legal text.
- **Key points:** Instantly summarize the core purpose of the agreement.
- **Obligations:** Extract explicitly stated duties for both parties.
- **Important dates:** Highlight deadlines, effective dates, and renewals.
- **Financial terms:** Clearly outline fees, payment schedules, and penalties.
- **Termination terms:** Summarize conditions under which the contract can end.
- **Risk identification:** Flag medium and high-severity risks and red flags.
- **Inconsistency detection:** Identify contradictory clauses within the document.
- **Questions for a lawyer:** Generate recommended questions for professional legal counsel.
- **Document-grounded Q&A:** Ask questions and get answers based strictly on the document text.
- **Per-document chat history:** Maintain persistent conversational history for each document you review.
- **Contract/document comparison:** Compare different versions of documents to find changes.
- **Evidence-aware analysis:** Every AI claim is grounded with a direct quote and citation.
- **Legal disclaimer:** Clear boundaries stating the tool provides information, not legal advice.

## How It Works
Upload → Extract → Analyze → Index → Ask → Retrieve relevant document context → Generate grounded response

## Technology Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** FastAPI, Python, Pydantic, SQLAlchemy, SQLite
- **AI:** Hugging Face inference pipeline, Document RAG (Retrieval-Augmented Generation)

## Project Structure
```
legal-assistance-ai/
├── backend/
│   ├── app/
│   │   ├── api/          # API routing
│   │   ├── core/         # Config, Database, Exceptions
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic models
│   │   ├── services/     # Business logic, RAG, LLM
│   │   └── utils/        # Parsers, normalizers
│   └── tests/            # Pytest test suite
├── frontend/
│   ├── src/
│   │   ├── components/   # React UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Route pages
│   │   ├── services/     # API integration
│   │   └── types/        # TypeScript definitions
└── README.md
```

## Local Development

**Backend Setup:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables
Create a `.env` file in the root based on `.env.example`:
- `ENVIRONMENT`
- `DEBUG`
- `BACKEND_HOST`, `BACKEND_PORT`, `BACKEND_URL`
- `FRONTEND_URL`
- `HF_TOKEN`, `HF_MODEL`, `HF_BASE_URL`, `HF_MAX_TOKENS`
- `RAG_CHUNK_SIZE`, `RAG_CHUNK_OVERLAP`, `RAG_EMBEDDING_BATCH_SIZE`, `RAG_TOP_K`, `RAG_MIN_SIMILARITY`
- `MAX_ANALYSIS_CHARACTERS`, `MAX_COMPARISON_CHARACTERS`, `MAX_COMPARISON_SECTIONS`
- `DATABASE_URL`
- `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- `MAX_UPLOAD_SIZE_MB`, `ALLOWED_EXTENSIONS`
- `CORS_ORIGINS`, `CORS_ALLOW_CREDENTIALS`

## API
- `POST /api/v1/documents`: Upload a document
- `GET /api/v1/documents/{id}`: Retrieve document metadata
- `POST /api/v1/documents/{id}/analyze`: Run comprehensive legal analysis
- `POST /api/v1/documents/{id}/index`: Generate vector embeddings for RAG
- `POST /api/v1/documents/{id}/qa`: Ask grounded questions about the document
- `POST /api/v1/documents/compare`: Compare two documents

## Legal Disclaimer
LegalAI provides legal information and document analysis and is not a substitute for professional legal advice. Always consult a qualified attorney for specific legal concerns.

## Deployment
**Backend (Render / Railway / Heroku):**
The application natively binds to `0.0.0.0` and listens to `$PORT`. Set your environment variables, including `HF_TOKEN` and `SECRET_KEY`.
Start command:
```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Frontend (Vercel):**
Ensure the build command is `npm run build`. 
Set the `VITE_API_BASE_URL` environment variable in the Vercel dashboard to point to your deployed backend URL.

**Database & Storage Warning:**
By default, this application stores data (SQLite database, extracted documents, vector indexes) on the local filesystem. For production deployments on ephemeral filesystems (like Render or Heroku), you must configure persistent volumes for the `backend/data` directory, or switch `DATABASE_URL` to a managed PostgreSQL instance and migrate the file storage logic to S3.
