# Mi-LessonPlan - Product Requirements Document

## Overview
A comprehensive education platform for Tanzanian teachers supporting both Tanzania Mainland and Zanzibar syllabi. Features AI-powered lesson plan generation, scheme of work management, dictation tools, template library, file sharing with payment integration, and Binti Hamdani AI chatbot.

## Core Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, DOMPurify
- **Backend**: FastAPI, Motor (MongoDB async), WeasyPrint (PDF generation)
- **Database**: MongoDB Atlas (platform-managed)
- **Auth**: Direct Google OAuth (`@react-oauth/google`), Bearer token auth (localStorage + Authorization header)
- **Payments**: ClickPesa (PesaPal)
- **AI**: DeepSeek API (`deepseek-chat` model) for all AI features (Chat, Lessons, Schemes)
- **TTS**: OpenAI TTS via Emergent LLM Key

## Auth Architecture (Apr 2026)
- Google OAuth login → backend returns session_token in response body
- Frontend stores token in localStorage, sends via `Authorization: Bearer` header
- No cookies used for cross-origin auth (fixes proxy CORS conflicts)
- `api.js` has global axios interceptor + `authFetch()` helper for fetch() calls
- Backend `get_current_user()` checks cookie first, then Authorization header (backward compatible)

## Completed Features
- Google OAuth authentication (direct, not Emergent-managed)
- AI lesson plan generation (Mainland + Zanzibar syllabi)
- Scheme of Work with AI auto-fill generation
- Notes, Templates, Dictation, File Upload
- My Files repository with search/filter
- Shareable links with payment gating
- WhatsApp share integration
- PDF exports via WeasyPrint (landscape for schemes)
- Refer & Earn commission system
- Admin dashboard with analytics
- ClickPesa payment integration (live)
- PWA support
- Dictation: translate-then-speak with stored audio playback
- **Binti Hamdani**: Global AI chatbot powered by DeepSeek
- **Arabic Full Content Generation** (Apr 2026): Language-specific system prompts sent to DeepSeek
- **Scheme of Work Enhancements** (Apr 2026): Topics textarea, row count 20-60, editable rows
- **CORS Fix** (Apr 2026): Migrated from cookie to Bearer token auth across 30+ files to fix proxy CORS conflicts

## Production Setup
- Domain: mi-lessonplan.site
- Backend: mi-learning-hub.emergent.host
- Google OAuth origins: mi-lessonplan.site, mi-learning-hub.emergent.host, mi-learning-hub.preview.emergentagent.com

## Subscription Tiers
- Free: 10 lessons/month
- Standard (TZS 5,999): 50/month + notes, shared-links
- Professional (TZS 14,999): Unlimited + uploads, schemes, templates, dictation
- Master (TZS 29,999): Unlimited + Refer & Earn

## Upcoming Tasks
- P1: Refactor server.py (4700+ lines) into modular route files
- P2: Split massive React components (MyFiles.js, SchemeOfWorkForm.js)
- P2: Refactor clickpesa_integration.py webhook handler (high cyclomatic complexity)
- P4: Team accounts, mobile app, offline mode, Swahili UI
