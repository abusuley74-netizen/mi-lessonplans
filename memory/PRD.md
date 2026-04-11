# Mi-LessonPlan - Product Requirements Document

## Overview
A comprehensive education platform for Tanzanian teachers supporting both Tanzania Mainland and Zanzibar syllabi. Features AI-powered lesson plan generation, scheme of work management, dictation tools, template library, and file sharing with payment integration.

## Core Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, DOMPurify
- **Backend**: FastAPI, Motor (MongoDB async), WeasyPrint (PDF generation)
- **Database**: MongoDB Atlas (platform-managed)
- **Auth**: Direct Google OAuth (`@react-oauth/google`)
- **Payments**: ClickPesa (PesaPal)
- **AI**: OpenAI GPT-5.2 + TTS via Emergent LLM Key

## Completed Features
- Google OAuth authentication (direct, not Emergent-managed)
- AI lesson plan generation (Mainland + Zanzibar syllabi)
- Scheme of Work with AI auto-fill generation
- Notes, Templates, Dictation, File Upload
- My Files repository with search/filter
- Shareable links with payment gating
- WhatsApp share integration
- PDF exports (lessons, schemes, templates, notes) via WeasyPrint
- Landscape PDF for Scheme of Work (12-column tables)
- Refer & Earn commission system
- Admin dashboard with analytics
- ClickPesa payment integration (live, not sandbox)
- PWA support
- Dictation: translate-then-speak with stored audio playback

## Dictation Feature Details
- User types text in ANY language, selects output language
- Backend always translates to target language via GPT-5.2
- TTS generates audio in target language voice
- Audio saved as base64 in MongoDB with dictation record
- MyFiles playback uses stored audio (no re-generation cost)
- Download serves stored audio or regenerates as fallback

## Subscription Tiers & Limits
- Free: 10 lessons/month, basic features (my-files, profile, payment, activities)
- Basic/Standard (TZS 5,999): 50 lessons/month + notes, shared-links
- Premium/Professional (TZS 14,999): Unlimited + uploads, schemes, templates, dictation
- Master (TZS 29,999): Unlimited + Refer & Earn

## Link creation: Free and unlimited (all paid plans)
## Audio/AI generation: Uses Emergent LLM Key credits (not unlimited)

## Code Quality Fixes Applied (Apr 2026)
- Fixed CSP: Added cdn.fontshare.com, mi-lessonplan.site
- Fixed XSS: DOMPurify for all innerHTML/dangerouslySetInnerHTML
- Fixed 7+ missing React hook dependencies
- Fixed base64 scoping bug, period_start undefined, clickpesa syntax
- Fixed array index keys in dynamic lists
- Improved MongoDB connection resilience

## Known Infrastructure Issue
- MongoDB Atlas connectivity from preview pods is intermittent (IP whitelist)
- Production frontend .env must use REACT_APP_BACKEND_URL=https://mi-lessonplan.site

## Upcoming Tasks
- P1: Refactor server.py (3500+ lines) into modular route files
- P4: Team accounts, mobile app, offline mode, Swahili UI
