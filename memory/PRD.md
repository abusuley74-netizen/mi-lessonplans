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

## Admin Dashboard Pages (All Implemented)
- **Dashboard/Analytics & Reports**: KPI cards, subscription distribution, revenue by plan, popular subjects, user growth
- **Content Management**: Content stats, most active creators, searchable lessons table
- **Referral Registry**: All referrers with commission tracking, payout management
- **Refer and Earn**: Admin's own referral code, shareable link, social sharing
- **User Management**: User list with roles and actions
- **Subscription Management**: PesaPal transaction viewer
- **Admin Profiles**: Admin account management

## Core Features (Implemented)
- Google OAuth Login (Emergent-managed) for teachers
- Admin Login (email/password) accessible from main login page
- AI Lesson Plan Generator (GPT-5.2 via Emergent LLM Key)
- Subscription Tier Gating — sidebar lock icons, upgrade modal, lesson counter
- MyHub Dashboard with tier-gated sidebar navigation
- Dictation Tool (OpenAI TTS with GPT-5.2 auto-translation)
- Rich Text Notes Editor
- Scheme of Work Generator with AI
- MyFiles Manager — View/Download all file types (lessons, templates, dictations, uploads, schemes)
- Profile Settings with custom picture upload
- 6 Specialized Template Editors
- Shared Link Pipeline — share resources via public links, auto-expire
- MHTML Document Export — Word documents with embedded images
- Referral & Earn System — 30% commission, admin payout management
- PesaPal Payment Integration — PRODUCTION checkout
- Subscription Management — Basic, Premium, Master plans
- **PWA Support** — manifest.json, service worker, install prompt for PC & mobile

## Branding (Updated 2026-04-04)
- App name: **Mi-LessonPlan** (with hyphen)
- Logo: Custom infinity/teacher logo at `/public/logo.jpg`
- Favicon: Custom icons at 16x16, 32x32, 192x192, 512x512
- Page title: "Mi-LessonPlan"
- No "Made with Emergent" badge
- Production domain: `mi-lessonplan.site`
- Referral links: `https://mi-lessonplan.site/login?ref=CODE`
- Shared links: `{origin}/shared/{code}` (domain-agnostic)

## My Files (Updated 2026-04-04)
- Cards use `overflow-hidden`, `truncate`, compact `text-xs` buttons
- Upload cards truncate long content_type strings
- Dictation cards support Share, Play, Download with flex-wrap
- Shared dictation links now download real MP3 audio via TTS API

## 3rd Party Integrations
- Emergent Google Auth, OpenAI GPT-5.2, OpenAI TTS tts-1, PesaPal (PRODUCTION)

## Known External Issues
- PesaPal account has transaction limit of TZS 9,999. Premium/Master plans blocked.

## Backlog
- P2: Granular loading spinners per input field during AI generation
- P3: Route modularization (server.py 3200+ lines -> routes/)
- P4: Team accounts, mobile app, offline mode, Swahili UI
