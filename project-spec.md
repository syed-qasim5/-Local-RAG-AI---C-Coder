# Project Specification: Local Vector-Search Brain

## Architecture Overview
A full-stack local application that ingests C++ code files, converts them into vector embeddings using the Google Gemini free API, and allows the user to chat with their codebase using Retrieval-Augmented Generation (RAG).

## Tech Stack
- **Frontend:** React (Vite), Tailwind CSS
- **Backend:** Node.js, Express
- **AI/ML:** `@google/generative-ai` SDK
- **Vector Math:** Cosine similarity function (custom built to avoid heavy vector DB setups for a local prototype)

## Folder Structure
/backend
  - server.js
  - .env
  - /data (User will drop .cpp and .h files here)
/frontend
  - (Standard Vite React app structure)

## Core Features
1. **Document Ingestion (Backend `server.js`):**
   - Read all `.cpp` and `.h` files from the `/backend/data` directory.
   - Chunk the text (e.g., 1000 characters per chunk).
   - Use the Gemini API `text-embedding-004` model to generate embeddings for each chunk.
   - Store the chunks and their embeddings in memory (an array of objects).
2. **Chat Endpoint (Backend `/api/chat`):**
   - Accept a user query via POST request.
   - Generate an embedding for the user query using Gemini.
   - Calculate cosine similarity between the query embedding and the stored code chunk embeddings to find the top 3 most relevant chunks.
   - Send the user query + the relevant code chunks to the `gemini-1.5-flash` model. Instruct the system to act as an expert C++ reviewer.
   - Return the AI's response to the frontend.
3. **Frontend UI (React/Tailwind):**
   - A clean, dark-mode chat interface.
   - An input box to type questions about the code.
   - A message display area showing user questions and AI answers.
   