# Kraken RAG Workspace - Proprietary AI Assistant

An Enterprise RAG (Retrieval-Augmented Generation) system built for **Mattia Negrelli** to analyze proprietary PDFs and product catalogs. This system allows clients to upload their knowledge base and chat with it using an AI assistant that cites its sources.

**Stack:** Next.js (App Router), Prisma, Neon Postgres (pgvector), Vercel Blob, OpenAI.

## 🚀 Features

*   **Secure Dashboard:** Protected by an `ADMIN_KEY` middleware.
*   **Knowledge Base:** Drag & Drop PDF upload w/ status tracking.
*   **Ingestion Pipeline:**
    *   Extracts text using `pdf-parse`.
    *   Smart chunking with overlap logic.
    *   Embeddings via OpenAI `text-embedding-3-small`.
    *   Vector storage in Postgres (pgvector).
*   **RAG Chat:**
    *   Semantic search using cosine similarity.
    *   Strict "Answer from context only" prompting.
    *   Source citations (Document + Page number + Quote).

## 🛠️ Local Setup

1.  **Clone & Install:**
    ```bash
    git clone ...
    npm install
    ```

2.  **Environment Variables (`.env`):**
    ```env
    DATABASE_URL="postgresql://user:pass@ep-host.region.aws.neon.tech/neondb?sslmode=require"
    OPENAI_API_KEY="sk-..."
    BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
    ADMIN_KEY="my-secret-password"
    ```

3.  **Database Setup:**
    *   Go to Neon SQL Editor and run: `CREATE EXTENSION vector;`
    *   Push schema: `npx prisma db push`

4.  **Run:**
    ```bash
    npm run dev
    ```

## 📦 Deployment (Vercel)

1.  Import project to Vercel.
2.  Add Environmental Variables (same as above).
3.  Deploy! (The build ensures dynamic rendering for API routes).

## ⚠️ Admin Access
To access the dashboard, visit `/login` and enter your `ADMIN_KEY`.
