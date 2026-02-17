# GEMINI.md - Project Overview: gastos-kv-mvp

This document provides a comprehensive overview of the `gastos-kv-mvp` project for AI-powered development assistance.

## Project Overview

`gastos-kv-mvp` is a Next.js application designed for tracking expenses. It's a Minimum Viable Product (MVP) that exposes two simple API endpoints: one for recording a new expense and another for exporting a month's expenses to a CSV file.

The application uses Vercel KV as its data store, which is a serverless Redis database. Authentication is managed through API keys, which are mapped to predefined user IDs.

### Core Technologies

*   **Framework:** Next.js (React)
*   **Language:** TypeScript
*   **Database:** Vercel KV (Redis)
*   **Deployment:** Vercel (inferred)

### Architecture

*   **Frontend:** A minimal frontend exists at the root (`/`) to display basic information about the available endpoints.
*   **Backend (API Routes):**
    *   `POST /api/gasto`: Receives a JSON payload with an expense description (`text`). It parses the text to extract the amount, bank, and description, then stores it in Vercel KV. It requires an `x-api-key` header for authentication.
    *   `GET /api/export.csv`: Exports all expenses for a given month (`YYYY-MM`) as a CSV file. It requires an API key as a query parameter.
*   **Business Logic:** The core logic for parsing expense text, handling dates, and interacting with the database is located in `lib/gastos.ts`.
*   **Configuration:** Environment variables are used to configure API keys (`USER_KEYS_JSON`).

## Building and Running

The project uses `npm` as the package manager.

### Prerequisites

*   Node.js
*   `npm`
*   A Vercel account with Vercel KV storage set up.
*   A `.env.local` file with the required environment variables.

### Key Commands

The following commands are defined in `package.json`:

*   **Install dependencies:**
    ```bash
    npm install
    ```
*   **Run the development server:**
    ```bash
    npm run dev
    ```
*   **Build for production:**
    ```bash
    npm run build
    ```
*   **Start the production server:**
    ```bash
    npm run start
    ```
*   **Run linter:**
    ```bash
    npm run lint
    ```

## Development Conventions

*   **Authentication:** All API requests are authenticated using an `x-api-key` header or a `key` query parameter. The mapping of keys to users is stored in the `USER_KEYS_JSON` environment variable.
*   **Data Model:** Expense events are stored as JSON objects in Vercel KV. An index is maintained for each month to allow for efficient querying.
*   **Code Style:** The project follows standard TypeScript and Next.js conventions. The code is not heavily commented, but the function and variable names are descriptive.
*   **Error Handling:** The API endpoints include basic `try...catch` blocks for error handling and return appropriate HTTP status codes (400 for bad requests, 401 for unauthorized, 500 for server errors).
