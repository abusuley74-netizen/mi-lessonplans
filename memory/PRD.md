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

Plan Badges: Basic=Starter (blue), Premium=Pro (purple), Master=Elite (amber)
Lesson count resets every 30 days from subscription start date.

## Core Features (Implemented)
- **Google OAuth Login** (Emergent-managed) for teachers
- **Admin Login** (email/password) accessible from main login page
- **AI Lesson Plan Generator** (GPT-5.2 via Emergent LLM Key)
- **Subscription Tier Gating** — sidebar lock icons, upgrade modal, lesson counter
- **MyHub Dashboard** with tier-gated sidebar navigation
- **Dictation Tool** (OpenAI TTS with GPT-5.2 auto-translation)
- **Rich Text Notes Editor** (CreateNotes with formatting toolbar)
- **Scheme of Work Generator** with AI, Add Row, Save, Export DOCX
- **MyFiles Manager** with delete modals, blob downloads, audio playback, share buttons
- **Profile Settings** with custom picture upload
- **6 Specialized Template Editors** (Basic, Scientific, Geography, Mathematics, Physics, Chemistry)
- **Shared Link Pipeline** — share resources via public links, auto-expire
- **MHTML Document Export** — Word documents with embedded images
- **Admin System** — Full admin dashboard with login, user management, analytics, Lucide sidebar icons
- **Referral & Earn System** — Teacher referrals with commission tracking (Master tier only)
- **PesaPal Payment Integration** — PRODUCTION checkout via PesaPal API
- **Subscription Management** — Basic (TZS 9,999), Premium (TZS 19,999), Master (TZS 29,999)
- **Promo Banner System** — Admin-managed promotional banners
- **Communication System** — Admin-to-user notifications
- **Cron Subscription Renewal** — Auto-renew expired subscriptions

## Architecture
```
/app
├── backend/
│   └── server.py              # FastAPI (80+ API routes)
├── frontend/src/
│   ├── components/
│   │   ├── Templates.js, MathTemplate.js, PhysicsTemplate.js, ChemistryTemplate.js
│   │   ├── GeographyTemplate.js, ScientificTemplate.js
│   │   ├── MathKeyboard.js, PhysicsKeyboard.js, ChemistryKeyboard.js
│   │   ├── ShareModal.js, SharedView.js, MySharedLinks.js
│   │   ├── AdminProfileManager.js, AdminReferAndEarn.js, AdminRoutes.js
│   │   ├── PesaPalTransactionManager.js, ReferralRegistry.js
│   │   ├── TeacherReferAndEarn.js, UserManagement.js
│   │   ├── Dictation.js, CreateNotes.js, SchemeOfWorkForm.js
│   │   ├── MyFiles.js, ProfileSettings.js, Header.js
│   │   ├── PaymentSettings.js, SubscriptionModal.js
│   ├── contexts/ (AuthContext.js, AdminContext.js)
│   ├── pages/ (MyHub.js, Dashboard.js, SubscribePage.js, AdminDashboard.js, AdminLogin.js, LoginPage.js)
│   ├── lib/ (utils.js, referralService.js)
│   └── App.js
└── memory/ (PRD.md, test_credentials.md)
```

## DB Collections
- `users` (with subscription_plan, lesson_period_start, lesson_period_count)
- `user_sessions`, `lesson_plans`, `notes`, `dictations`, `schemes`, `templates`, `uploads`
- `shared_links`, `admins`, `admin_sessions`, `referrals`
- `pesapal_transactions`, `notifications`, `promo_banners`

## 3rd Party Integrations
- Emergent Google Auth (teacher login)
- OpenAI GPT-5.2 (AI generation) via Emergent LLM Key
- OpenAI TTS tts-1 (dictation) via Emergent LLM Key
- PesaPal (payments) — PRODUCTION keys

## Known External Issues
- PesaPal account has transaction limit of TZS 9,999. Premium and Master plans fail at checkout. User needs to contact PesaPal to increase their account limit.

## Backlog
- P2: Granular loading spinners per input field during AI generation
- P3: Route modularization (server.py 2500+ lines → routes/)
- P3: Team accounts, mobile app, offline mode, Swahili UI
