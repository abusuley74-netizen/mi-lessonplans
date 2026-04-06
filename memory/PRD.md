# Mi-LessonPlan - Product Requirements Document

## Overview
AI-powered lesson planning platform for Tanzanian teachers, supporting Tanzania Mainland & Zanzibar syllabi. Built with React + FastAPI + MongoDB. Branded as **Mi-LessonPlan** with custom logo, PWA support, and production domain `mi-lessonplan.site`.

## Subscription Tiers & Feature Access

| Feature | Free | Basic (9,999) | Premium (19,999) | Master (29,999) |
|---|---|---|---|---|
| Lesson plans | 10/month | 50/month | Unlimited | Unlimited |
| My Files | Yes | Yes | Yes | Yes |
| Profile Settings | Yes | Yes | Yes | Yes |
| Payment Settings | Yes | Yes | Yes | Yes |
| My Activities | Yes | Yes | Yes | Yes |
| Create Notes | - | Yes | Yes | Yes |
| Shared Links | - | Yes | Yes | Yes |
| Upload Materials | - | - | Yes | Yes |
| Scheme of Work | - | - | Yes | Yes |
| Templates | - | - | Yes | Yes |
| Dictation | - | - | Yes | Yes |
| Refer & Earn | - | - | - | Yes |

## Core Features (Implemented)
- **Direct Google OAuth** — user's own Google Client ID, no Emergent intermediary
- AI Lesson Plan Generator (GPT-5.2 via Emergent LLM Key)
- Subscription Tier Gating — sidebar lock icons, upgrade modal, lesson counter
- MyHub Dashboard with tier-gated sidebar navigation
- Dictation Tool (OpenAI TTS with GPT-5.2 auto-translation)
- Rich Text Notes Editor
- Scheme of Work Generator with AI
- MyFiles Manager — View/Download all file types
- Profile Settings with custom picture upload
- 6 Specialized Template Editors
- Shared Link Pipeline — share all resource types including uploads, WhatsApp integration
- MHTML Document Export — Word documents with embedded images
- Referral & Earn System — 30% commission, admin payout management
- PesaPal Payment Integration — PRODUCTION checkout
- PWA Support — manifest.json, service worker, install prompt for PC & mobile

## Branding
- App name: **Mi-LessonPlan** (with hyphen)
- Slogan: "Secure Tanzania Mindset"
- Logo: Custom logo at `/public/logo.jpg`
- Header: Light green background (#D5E8D0)
- No "Made with Emergent" badge
- Production domain: `mi-lessonplan.site`

## Auth (Updated 2026-04-06)
- Direct Google OAuth via @react-oauth/google + google-auth backend verification
- Google Client ID: 994004322929-jrp5mo9go5s6qs4tl4trl93sqsjue7kn.apps.googleusercontent.com
- After auth → straight to /dashboard
- Admin login: separate /admin/login with email/password

## Sharing (Updated 2026-04-06)
- All resource types supported: lesson, note, scheme, template, dictation, upload
- WhatsApp share button with pre-filled message
- Copy link button
- 1-download auto-expire links

## 3rd Party Integrations
- Direct Google OAuth (user's own Client ID), OpenAI GPT-5.2, OpenAI TTS tts-1, PesaPal (PRODUCTION)

## Backlog
- P2: Granular loading spinners per input field during AI generation
- P3: Route modularization (server.py 3400+ lines -> routes/)
- P4: Team accounts, mobile app, offline mode, Swahili UI
