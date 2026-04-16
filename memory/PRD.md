# Mi-LessonPlan - Product Requirements Document

## Overview
A comprehensive education platform for Tanzanian teachers supporting both Tanzania Mainland and Zanzibar syllabi. Features AI-powered lesson plan generation, scheme of work management, dictation tools, template library, file sharing with payment integration, and Binti Hamdani AI chatbot.

## Core Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, DOMPurify
- **Backend**: FastAPI, Motor (MongoDB async), WeasyPrint (PDF generation)
- **Database**: MongoDB Atlas (platform-managed)
- **Auth**: Direct Google OAuth (`@react-oauth/google`)
- **Payments**: ClickPesa (PesaPal)
- **AI**: DeepSeek API (`deepseek-chat` model) for all AI features (Chat, Lessons, Schemes)
- **TTS**: OpenAI TTS via Emergent LLM Key

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
- **Arabic Full Content Generation** (Apr 2026): Language-specific system prompts now correctly sent to DeepSeek API for Arabic, Swahili, French lessons and schemes
- **Scheme of Work Enhancements** (Apr 2026): Topics textarea for syllabus guidance, row count selector (20-60, default 35), editable textarea rows post-generation, scaled max_tokens for larger schemes

## Binti Hamdani Chatbot (Apr 2026)
- Global floating chatbot accessible from ANY page
- Single BintiChat component (removed 3 duplicated copies from form files)
- Powered by DeepSeek API (`deepseek-chat` model)
- Full conversation history (last 10 messages)
- Markdown rendering (bold, lists, headings, code)
- Auto-scroll to latest message
- Quick prompt suggestions for new users
- Minimize/maximize/clear chat controls
- Deep curriculum knowledge: Tanzania Mainland (NECTA) + Zanzibar (ZEC)

## Subscription Tiers
- Free: 10 lessons/month
- Standard (TZS 5,999): 50/month + notes, shared-links
- Professional (TZS 14,999): Unlimited + uploads, schemes, templates, dictation
- Master (TZS 29,999): Unlimited + Refer & Earn

## Production Setup
- Domain: mi-lessonplan.site
- Backend: mi-learning-hub.emergent.host
- Google OAuth origins: mi-lessonplan.site, mi-learning-hub.emergent.host, mi-learning-hub.preview.emergentagent.com

## Upcoming Tasks
- P1: Refactor server.py (4700+ lines) into modular route files
- P2: Move Auth tokens from localStorage to httpOnly cookies
- P2: Split massive React components (MyFiles.js, SchemeOfWorkForm.js)
- P2: Refactor clickpesa_integration.py webhook handler (high cyclomatic complexity)
- P4: Team accounts, mobile app, offline mode, Swahili UI
