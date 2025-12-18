# Proprietary RAG System (MVP)

A custom Retrieval-Augmented Generation system built with Next.js App Router, Prisma, Postgres (`pgvector`), and OpenAI.
Designed for 1-to-1 client projects with distinct workspaces.

## Features

- **Upload**: Drag & drop PDF uploading (stored in Vercel Blob).
- **Ingestion**: Auto-extraction of text, chunking, and vector embedding generation (OpenAI `text-embedding-3-small`).
- **Storage**: Vector storage in Postgres using `pgvector`.
- **Chat**: RAG-based Q&A with strict source citation (Document Name + Page Number).
- **Tenant Isolation**: All queries filtered by `workspaceId`.

## Prerequisites

1. **Node.js**: v18+
2. **PostgreSQL Database**: Must support extensions. (Recommended: Neon.tech)
3. **OpenAI API Key**: With access to embeddings and GPT-4o-mini.
4. **Vercel Blob**: Or S3 compatible storage token.

## Setup Instructions

### 1. Database Setup (Neon/Postgres)

You MUST enable the `vector` extension before deploying the schema. Run this SQL in your database console:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

- `DATABASE_URL`: Your Postgres connection string.
- `OPENAI_API_KEY`: start with `sk-...`
- `BLOB_READ_WRITE_TOKEN`: Your Vercel Blob token (or similar).

### 3. Install & Init

```bash
# Install dependencies
npm install

# Push schema to database
npx prisma db push
```

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000/documents` to start.

## Deployment (Vercel)

1. Push to GitHub.
2. Import project in Vercel.
3. Add Environment Variables in Vercel Project Settings.
4. **Build Command**: `npx prisma generate && next build` (Next.js default usually works, but ensure prisma generate runs).
5. Deploy.

## API Reference

- `POST /api/documents/upload`: Upload PDF.
- `POST /api/documents/[id]/ingest`: Trigger processing.
- `POST /api/chat`: Chat with documents.
  - Body: `{ "message": "...", "workspaceId": "..." }`

## Commands

- **Prisma Studio** (View DB): `npx prisma studio`
- **Reset DB**: `npx prisma migrate reset` (Caution!)

