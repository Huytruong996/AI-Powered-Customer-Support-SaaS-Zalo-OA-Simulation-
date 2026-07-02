# Zalo AI SaaS MVP - Progress Report

This document tracks the ongoing development progress of the Zalo AI SaaS MVP to ensure seamless handoffs between sessions.

## Current Status: Phase 5 Completed (MVP Core Complete)

### Completed Work (Phase 1)
- **Project Scaffold**: Next.js 15 frontend, Express.js backend.
- **Database Architecture**: PostgreSQL + Prisma schema setup.
- **Backend API Core**: JWT Authentication, Express middlewares.
- **Frontend Core**: Landing, Login, Register, Dashboard layout.

### Completed Work (Phase 2 - Inbox System)
- **Database Update**: Added `Conversation` and `Message` models.
- **Backend Endpoints**: Implemented conversation list (paginated), detail view, and send message features.
- **Webhook Integration**: Implemented real database persistence for Zalo webhook (creates Customer -> Conversation -> Message).
- **Frontend UI**: Built `/inbox` sidebar and `/inbox/[conversationId]` detailed chat view with custom `MessageBubble` and `ChatInput` components using Shadcn UI.

### Completed Work (Phase 3 - CRM)
- **Backend Endpoints**: Implemented customer list, detailed view, and update capabilities (tags, notes, details).
- **Frontend UI**: Built `/customers` directory with search/tag filters and `/customers/[id]` detailed profile page.

### Completed Work (Phase 4 - AI Features)
- **Backend Architecture**: Added `AIProvider` interface supporting Gemini and OpenRouter. 
- **AI Endpoints**: Implemented AI suggestion mode (`/ai/suggest`), Auto-reply mode (`/ai/auto-reply`), and AI Config CRUD.
- **Canned Responses**: Implemented backend CRUD for `CannedResponse` and created `/templates` management UI on the frontend.
- **Frontend UI**: Built `/settings/ai` configuration page to toggle auto-reply and manage AI Prompts and API keys.

### Completed Work (Phase 5 - Analytics & Team)
- **Dashboard**: Wired up `/dashboard` to use real database statistics (`/conversations/stats` endpoint) for Total Customers, Active Conversations, and Total Messages.

### Completed Work (Phase 6 - Advanced Contextual RAG)
- **Vector Database**: Upgraded PostgreSQL to use the `pgvector` extension and added the `Knowledge` model to store documents/product info with vector embeddings.
- **Embeddings Pipeline**: Implemented `generateEmbedding` using Gemini (`text-embedding-004`).
- **Context Utility**: Created `ai-context.ts` that dynamically builds a system prompt injecting CRM Data, 10 recent messages, and top 3 relevant Knowledge items via Cosine Distance vector search.
- **Controller Integration**: Updated AI endpoints (`suggestReply`, `autoReply`) and the Zalo webhook to automatically contextualize AI responses with RAG data.
- **Knowledge API**: Created standard CRUD and automated embedding generation API routes (`/api/v1/knowledge`) to allow staff to populate the RAG database.

## Pending / Next Steps (Post-MVP Enhancements)
- **WebSockets / SSE**: Currently using basic polling (10s/5s) for real-time updates. Refactoring to WebSockets or Server-Sent Events will improve responsiveness.
- **Zalo API Integration**: Currently the webhook *receives* messages, but sending messages via Zalo OA API requires valid Zalo API keys to be configured and tested.
- **Testing**: While unit/integration test placeholders exist, comprehensive E2E tests using Playwright/Cypress should be added before production deployment.
- **Deployment**: Setup CI/CD for deploying the frontend to Vercel and the backend to Railway/Render with the Neon PostgreSQL DB.

### Recent Fixes & QA Readiness
- **Auth**: Added missing email/password validation on registration. Ensured `logout` fully redirects to `/login`.
- **Inbox**: Added Search UI and Pagination state to the Inbox sidebar.
- **CRM (Customers)**: Added `Tag` filtering input and Pagination buttons to the Customers list page.
- **AI Auto-Reply**: Fully integrated `autoReply` logic into the Zalo Webhook handler. When enabled, incoming messages automatically trigger an AI response which is saved to the database.
- **AI Suggestion**: Added robust error alerts on the frontend when AI fails to generate a suggestion (e.g. missing API keys). Implemented **Server-Sent Events (SSE) Streaming** to improve latency by delivering chunked responses, and improved UX by adding an **AI Prompt Popup** modal for targeted contextual AI suggestions without disrupting the main chat box.
All cases in `test_checklist.md` are now fully implemented in code and ready for manual QA verification.

---
*Note: As per the updated `SKILL.md` instructions, this file must be updated at the end of every major process to accurately reflect the current state of the application.*
