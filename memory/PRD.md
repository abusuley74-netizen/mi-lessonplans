# Mi-LessonPlan - Product Requirements Document

## Overview
AI-powered lesson planning platform for Tanzanian teachers, supporting Tanzania Mainland & Zanzibar syllabi. Built with React + FastAPI + MongoDB. Branded as **Mi-LessonPlan** with custom logo, PWA support, and production domain `mi-lessonplan.site`.

## Core Features (Implemented)
- **Direct Google OAuth** — user's own Google Client ID, no intermediary
- **AI Lesson Plan Generator** (GPT-5.2) — bilingual tables for Zanzibar & Mainland
- **AI Scheme of Work Generator** (GPT-5.2) — auto-fills competency rows by syllabus, subject, class, term
- Subscription Tier Gating — Free (10/month), Basic (50), Premium/Master (Unlimited)
- MyHub Dashboard with tier-gated sidebar
- Dictation Tool (OpenAI TTS with GPT-5.2 translation)
- Rich Text Notes Editor
- MyFiles Manager — View/Download all file types
- 6 Specialized Template Editors
- Shared Link Pipeline — all resource types, WhatsApp integration
- MHTML Document Export — Word docs with embedded images
- Referral & Earn System — 30% commission
- PesaPal Payment Integration — PRODUCTION
- PWA Support — manifest.json, service worker, install prompt
- Admin Dashboard with Analytics, Content Management, Referral Registry

## Branding
- App name: **Mi-LessonPlan**
- Slogan: "Secure Tanzania Mindset"
- Header: Light green (#D5E8D0)
- Production domain: `mi-lessonplan.site`

## 3rd Party Integrations
- Direct Google OAuth, OpenAI GPT-5.2, OpenAI TTS tts-1, PesaPal (PRODUCTION)

## Backlog
- P2: Granular loading spinners per input field during AI lesson generation
- P3: Route modularization (server.py 3500+ lines -> routes/)
- P4: Team accounts, mobile app, offline mode, Swahili UI
