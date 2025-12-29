# Documents / Knowledge Base

This section manages the document ingestion pipeline for the RAG assistant.

## Features

- **Document List**: View all uploaded documents, their status (READY, PROCESSING, ERROR), and metadata (page count, upload date).
- **Multiple File Upload**: Drag and drop multiple PDF files to upload them simultaneously.
- **Ingestion Pipeline**: 
  1. Files are uploaded to storage.
  2. A database record is created.
  3. The ingestion process is triggered to parse and vectorise the content.
- **Search**: Value-based search filtering of the document list.
- **Preview**: Click on a document to view it in a modal.

## Components

- **`page.tsx`**: Main controller component. Handles state for `documents`, `uploading`, and `searchQuery`.
- **`onDrop`**: Callback handler for `react-dropzone`. Iterates through selected files and initiates parallel uploads.
- **`StatusBadge`**: Visual indicator of the document's processing state.

## Usage

Navigate to `/documents` to manage the knowledge base. Only `.pdf` files are currently supported.
