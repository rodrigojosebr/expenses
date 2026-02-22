# GEMINI.md - Project Overview: gastos-kv-mvp

This document provides a comprehensive overview of the `gastos-kv-mvp` project. It serves as the source of truth for architectural decisions, coding standards, and project goals for AI-powered development assistance.

## Project Overview

`gastos-kv-mvp` is a Next.js application for tracking expenses. The application is transitioning from a personal tool using Vercel KV to a multi-user SaaS platform using PostgreSQL. The primary interface includes a voice-first page for recording expenses and a dashboard for managing them.

### Core Technologies

*   **Framework:** Next.js (React - App Router)
*   **Language:** TypeScript
*   **Database:** Neon (Serverless PostgreSQL)
*   **ORM:** Prisma
*   **Authentication:** NextAuth.js (Auth.js) with Credentials & bcryptjs
*   **Validation:** Zod
*   **Styling:** PandaCSS (zero-runtime, type-safe CSS-in-JS)
*   **AI Engine:** Google Gemini SDK (Natural language parsing of expenses)
*   **Mobile / PWA:** next-pwa (Installable web app logic)

### Architecture (Clean Code & Separation of Concerns)

The project strictly follows a layered architecture to separate business logic from UI and infrastructure:

*   **1. Presentation Layer (UI/Components/PWA):**
    *   `/app`: Next.js App Router pages, API route handlers, and PWA manifest.
    *   `/components`: Reusable UI components following Atomic Design (`ui`, `features`, `layout`).
*   **2. Application / Validation Layer:**
    *   `/schemas`: Zod schemas for strict runtime validation of API requests and form submissions (e.g., `expenseSchema.ts`, `authSchema.ts`).
    *   `/types`: TypeScript definitions inferred from Prisma and Zod schemas.
*   **3. Business Logic Layer (AI Integration):**
    *   `/services`: Contains core business rules. Specifically, `aiParserService.ts` completely replaces legacy Regex functions by calling the Google Gemini API (`gemini-2.5-flash`) to intelligently extract structured JSON (`amountCents`, `description`, `date`, `paymentMethod`) from natural language raw transcribed text. Services do not talk directly to the database.
*   **4. Data Access Layer (Repository Pattern):**
    *   `/repositories` (or `/lib/db`): Abstracts all database operations. API routes must call repositories (e.g., `expenseRepository.ts`), never Prisma directly. This makes future database migrations trivial.
    *   `/prisma`: Contains `schema.prisma` defining `User` and `Expense` models, configured to connect to the Neon serverless PostgreSQL database.

## Development Conventions

*   **Authentication:** The app uses NextAuth.js. Routes like `/voice` and `/dashboard` are protected by Next.js Middleware. User IDs are extracted securely from the NextAuth session, not from headers or client requests.
*   **Database Access:** 
    *   **NEVER** use direct ORM calls (`prisma.expense...`) inside Next.js API Routes (`app/api/.../route.ts`).
    *   **ALWAYS** use the Repository Pattern (e.g., `ExpenseRepository.create(...)`).
*   **Validation:** All incoming API payloads must be validated against a Zod schema before processing.
*   **Error Handling:** API endpoints must return structured JSON errors (`{ error: string }`) with appropriate HTTP status codes (400 for validation, 401 for auth, 500 for server errors).
*   **Code Style:** Strict TypeScript. No `any`. Variables must be camelCase, components PascalCase.

## Key Commands

*   `npm run dev` - Start development server
*   `npx prisma db push` - Sync Prisma schema with database
*   `npx prisma studio` - Open Prisma visual database editor
*   `npx tsc --noEmit` - Type-check the project
