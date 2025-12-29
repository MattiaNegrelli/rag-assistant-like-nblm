# Chat Assistant

The core RAG (Retrieval-Augmented Generation) interface.

## Features

- **Interactive Chat**: Conversational interface with the AI assistant.
- **Context-Aware**: The assistant uses the ingested documents from the Knowledge Base to provide grounded answers.
- **Streaming Responses**: Real-time text generation for a responsive experience.
- **Sources**: (Planned) Citation of specific documents used in the answer.

## Components

- **`page.tsx`**: The main chat view. Handles message history `messages` and user input.
- **Backend Integration**: Communicates with `/api/chat` to send prompts and receive streaming responses.

## Usage

Navigate to `/chat` to start asking questions based on the uploaded documents.
