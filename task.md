# Phase 2-5 Implementation Tasks

## Phase 2: Inbox System
### Backend
- `[x]` Create conversation controller with list, detail, send-message endpoints
- `[x]` Create conversation routes (protected by auth middleware)
- `[x]` Create customer controller/routes (list, detail)
- `[x]` Update Zalo webhook to persist messages into DB (create Customer + Conversation + Message)
- `[x]` Register new routes in `src/index.ts`
- `[x]` Add seed script for sample data

### Frontend
- `[x]` Add conversation & message types
- `[x]` Add conversation API service
- `[x]` Build `/inbox` page with conversation list
- `[x]` Build `/inbox/[conversationId]` page with message history
- `[x]` Create ConversationList component
- `[x]` Create MessageBubble component
- `[x]` Create ChatInput component
- `[x]` Update dashboard layout with proper sidebar navigation
- `[x]` Add shadcn components (Badge, ScrollArea, Avatar, Separator, Tabs)

## Phase 3: CRM
- `[x]` Build customer controller (CRUD, tags, notes, search, filters)
- `[x]` Build customer routes
- `[x]` Build `/customers` page
- `[x]` Build `/customers/[id]` page

## Phase 4: AI Features
- `[x]` Implement AI provider abstraction (interface + Gemini + OpenRouter)
- `[x]` AI suggestion mode endpoint
- `[x]` AI auto-reply mode endpoint
- `[x]` Canned responses CRUD endpoints
- `[x]` Build `/settings/ai` page
- `[x]` Build `/templates` page (canned responses)

## Phase 5: Analytics & Team
- `[x]` Analytics dashboard endpoint
- `[x]` Build `/settings` pages
