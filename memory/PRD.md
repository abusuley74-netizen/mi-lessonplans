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

## Code Quality Fixes Applied (Apr 2026)
- Fixed CSP: Added cdn.fontshare.com to font-src/style-src, added mi-lessonplan.site to connect-src
- Fixed XSS: Installed DOMPurify, sanitized all dangerouslySetInnerHTML and innerHTML usage
- Fixed 7+ missing React hook dependencies (useCallback wrapping)
- Fixed base64 scoping bug in build_download_content
- Fixed clickpesa_endpoints.py syntax error (leading space)
- Fixed period_start potentially undefined variable in server.py
- Fixed array index keys in ReferralRegistry and PesaPalTransactionManager
- Improved MongoDB connection resilience (60s timeout, retry options)

## Subscription Tiers
- Free: 10 lessons/month, basic features
- Standard (TZS 5,999): 30 lessons/month + sharing
- Professional (TZS 14,999): Unlimited lessons
- Master (TZS 29,999): Unlimited + Refer & Earn

## Known Infrastructure Issue
- MongoDB Atlas connectivity from preview pods is intermittent (IP whitelist)

## Upcoming Tasks
- P1: Refactor server.py (3500+ lines) into modular route files
- P4: Team accounts, mobile app, offline mode, Swahili UI
