# API Documentation

The backend API routes handling data persistence and AI operations.

## Endpoints

### Documents

- **`GET /api/documents`**: List all documents for the current workspace. Supports `?search=` query.
- **`POST /api/documents/upload`**: Handle file uploads. Expects `multipart/form-data` with `file` and `workspaceId`. Stores file and creates DB record.
- **`POST /api/documents/[id]/ingest`**: Trigger the ingestion process for a specific document ID.
- **`DELETE /api/documents/[id]`**: Remove a document and its associated data.

### Chat

- **`POST /api/chat`**: Main RAG endpoint.
  - **Body**: `{ messages: [...] }`
  - **Behavior**: Retrieves relevant context from vector store and streams LLM response.

### General

- **`route.ts`**: Standard Next.js App Router API handlers.
- **Dynamic Configuration**: Most routes use `export const dynamic = 'force-dynamic'` to ensure fresh data.
