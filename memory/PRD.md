# Mi-LessonPlan - Product Requirements Document

## Overview
Education platform for Tanzanian teachers. AI-powered lesson plans, schemes of work, test generation, dictation, templates, file sharing with payments.

## Tech Stack
- Frontend: React, Shadcn/UI, DOMPurify | Backend: FastAPI, Motor, WeasyPrint | DB: MongoDB
- Auth: Google OAuth + Bearer token (localStorage) | AI: DeepSeek API | Payments: ClickPesa

## Auth Architecture
- Bearer token auth (no cookies for cross-origin). Token in localStorage, sent via Authorization header.
- `api.js` global interceptor + `authFetch()` helper.

## AI Architecture
- All AI generation (lessons, schemes, tests, chat) uses async BackgroundTasks + polling to bypass 60s proxy timeout.
- Lesson: POST /api/lessons/generate → poll GET /api/lessons/{id}/status
- Scheme: POST /api/schemes/generate → poll GET /api/schemes/generate/{task_id}/status  
- Binti Chat: POST /api/binti-chat → poll GET /api/binti-chat/{id}/status
- Binti+: POST /api/binti-plus/generate → poll GET /api/binti-plus/{id}/status

## Completed Features
- Google OAuth, AI lesson plans (Mainland + Zanzibar), Scheme of Work with AI
- Notes, Templates, Dictation (with translation), File Upload, My Files
- Shareable links with payment gating, WhatsApp share, PDF exports
- Refer & Earn, Admin dashboard, ClickPesa payments, PWA
- Binti Hamdani global chatbot (DeepSeek)
- Arabic full content generation (language-specific prompts)
- Scheme: Topics textarea, 25 rows fixed, term-based months (T1: Jan-Jun, T2: Jul-Nov)
- CORS fix: Bearer token auth across 30+ files
- Async AI generation with polling (all endpoints)
- Dictation translation (DeepSeek translates before Azure TTS)
- **Binti Hamdani+** (Apr 2026): Full-page AI test/exam generator. Master Plan exclusive. NECTA & ZEC format knowledge. Generates complete HTML exam papers with proper sections, marks, instructions. Supports Swahili & English conversation. Printable output.

## Subscription Tiers & Features
- Free: My Files, Profile, Payment Settings, Activities
- Basic: + Notes, Shared Links
- Premium: + Uploads, Scheme, Templates, Dictation
- Master: + Binti Hamdani+, Refer & Earn

## Upcoming Tasks
- P1: Refactor server.py into modular routes
- P2: Split large React components
- P2: ClickPesa webhook refactor
- P3: Save generated tests to My Files, download as PDF
- P4: Team accounts, mobile app, offline mode, Swahili UI
