# MiLesson Plan - Product Requirements Document

## Overview
AI-powered lesson planning platform for Tanzanian teachers, supporting Tanzania Mainland & Zanzibar syllabi. Built with React + FastAPI + MongoDB.

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
- **Dashboard/Analytics & Reports**: KPI cards (users, revenue, lessons, active users), subscription distribution bars, revenue by plan, popular subjects, content summary, user growth chart, top creators
- **Content Management**: Content stats grid (6 types), most active creators leaderboard, searchable lessons table with preview/delete, pagination
- **Referral Registry**: All referrers with expandable referee lists, commission tracking, payout schedule settings, record payouts
- **Refer and Earn**: Admin's own referral code, shareable link, social sharing, commission rates, earnings dashboard
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
- MyFiles Manager
- Profile Settings with custom picture upload
- 6 Specialized Template Editors
- Shared Link Pipeline — share resources via public links, auto-expire
- MHTML Document Export — Word documents with embedded images
- Referral & Earn System — 30% commission, admin payout management
- PesaPal Payment Integration — PRODUCTION checkout
- Subscription Management — Basic, Premium, Master plans

## 3rd Party Integrations
- Emergent Google Auth, OpenAI GPT-5.2, OpenAI TTS tts-1, PesaPal (PRODUCTION)

## Known External Issues
- PesaPal account has transaction limit of TZS 9,999. Premium/Master plans blocked.

## Backlog
- P2: Granular loading spinners per input field during AI generation
- P3: Route modularization (server.py 2800+ lines → routes/)
- P3: Team accounts, mobile app, offline mode, Swahili UI
