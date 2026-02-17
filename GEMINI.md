# GEMINI.md - Project Overview: gastos-kv-mvp

This document provides a comprehensive overview of the `gastos-kv-mvp` project for AI-powered development assistance.

## Project Overview

`gastos-kv-mvp` is a Next.js application for tracking expenses. The primary interface is a voice-first page that allows users to record expenses by speaking. The application uses Vercel KV as its data store and features API endpoints for expense creation, user validation, and data export.

### Core Technologies

*   **Framework:** Next.js (React)
*   **Language:** TypeScript
*   **Database:** Vercel KV (Redis)
*   **Deployment:** Vercel (inferred)

### Architecture

*   **Frontend:**
    *   `/`: A minimal root page with basic endpoint information.
    *   `/voice`: The main user interface for recording expenses via voice recognition. It's a modern, dark-themed, client-side component.
*   **Backend (API Routes):**
    *   `POST /api/gasto`: Receives a JSON payload with an expense description (`text`). It parses the text, extracts the amount, bank, and description, and stores it in Vercel KV.
    *   `GET /api/export.csv`: Exports all expenses for a given month (`YYYY-MM`) as a CSV file.
    *   `GET /api/user`: Validates an API key (password) and returns the corresponding user information (`{id, name}`).
*   **Business Logic:** Located in `lib/gastos.ts`, this module contains core logic for:
    *   Parsing expense text, including amounts written as words (e.g., "vinte reais").
    *   Detecting the bank from the text.
    *   Handling user authentication.
*   **Configuration:** Environment variables are used to configure access passwords (`USER_KEYS_JSON`).

## Building and Running

The project uses `npm` as the package manager.

### Key Commands

*   **Install dependencies:** `npm install`
*   **Run the development server:** `npm run dev`
*   **Build for production:** `npm run build`
*   **Start the production server:** `npm run start`
*   **Run linter:** `npm run lint`

## Development Conventions

*   **Authentication:** API requests are authenticated using an `x-api-key` header or a `key` query parameter. The mapping of keys to user objects is stored in the `USER_KEYS_JSON` environment variable, with the following structure:
    ```json
    {
      "your-secret-key": { "id": "unique_user_id", "name": "display_name" }
    }
    ```
*   **Data Model:** Expense events are stored as JSON objects in Vercel KV. The event object now includes a `user` object (`{id, name}`). An index is maintained for each month for efficient, chronologically ordered queries.
*   **Code Style:** The project follows standard TypeScript and Next.js conventions.
*   **Error Handling:** API endpoints include `try...catch` blocks and return appropriate HTTP status codes.
