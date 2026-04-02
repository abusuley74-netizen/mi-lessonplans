# MiLesson Plan - Product Requirements Document

## Overview
AI-powered lesson planning platform for Tanzanian teachers, supporting Tanzania Mainland & Zanzibar syllabi. Built with React + FastAPI + MongoDB.

## Core Features (Implemented)
- **Google OAuth Login** (Emergent-managed) for teachers
- **Admin Login** (email/password) accessible from main login page
- **AI Lesson Plan Generator** (GPT-5.2 via Emergent LLM Key)
- **MyHub Dashboard** with sidebar navigation
- **Dictation Tool** (OpenAI TTS with GPT-5.2 auto-translation)
- **Rich Text Notes Editor** (CreateNotes with formatting toolbar)
- **Scheme of Work Generator** with AI, Add Row, Save, Export DOCX
- **MyFiles Manager** with delete modals, blob downloads, audio playback, share buttons
- **Profile Settings** with custom picture upload
- **6 Specialized Template Editors** (Basic, Scientific, Geography, Mathematics, Physics, Chemistry)
- **Shared Link Pipeline** — share resources via public links, auto-expire after 1 download, rating system
- **MHTML Document Export** — Word documents with embedded images for templates
- **Admin System** — Full admin dashboard with login, user management, analytics, content management, Lucide sidebar icons
- **Referral & Earn System** — Teacher referrals with commission tracking
- **PesaPal Payment Integration** — REAL production checkout via PesaPal API (OAuth 1.0, 302 redirect handling)
- **Subscription Management** — Basic (TZS 9,999), Premium (TZS 19,999), Enterprise (TZS 29,999)
- **Promo Banner System** — Admin-managed promotional banners
- **Communication System** — Admin-to-user notifications
- **Cron Subscription Renewal** — Auto-renew expired subscriptions

## Architecture
```
/app
├── backend/
│   └── server.py              # FastAPI (79+ API routes)
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
├── cron_renew_subscriptions.py
└── memory/ (PRD.md, test_credentials.md)
```

## DB Collections
- `users`, `user_sessions`, `lesson_plans`, `notes`, `dictations`, `schemes`, `templates`, `uploads`
- `shared_links`, `admins`, `admin_sessions`, `referrals`
- `pesapal_transactions`, `notifications`, `promo_banners`

## 3rd Party Integrations
- Emergent Google Auth (teacher login)
- OpenAI GPT-5.2 (AI generation) via Emergent LLM Key
- OpenAI TTS tts-1 (dictation) via Emergent LLM Key
- PesaPal (payments) — PRODUCTION keys configured

## Completed (as of Apr 2, 2026)
- [x] All teacher-facing features (lessons, notes, schemes, templates, dictation, files)
- [x] Shared Link Pipeline with auto-expiry and ratings
- [x] MHTML Word exports with embedded images
- [x] Full Admin System (dashboard, user mgmt, analytics, content, subscriptions)
- [x] Admin login page with email/password (linked from main login)
- [x] Admin dashboard sidebar with Lucide icons
- [x] Referral & Earn System
- [x] PesaPal Payment Integration (production — Basic plan verified working)
- [x] Promo Banner + Communication systems
- [x] Cron subscription renewal
- [x] Demo mode fallback removed from subscription flows

## Known External Issues
- PesaPal account has transaction limit of TZS 9,999. Premium (19,999) and Enterprise (29,999) plans fail with 'amount_exceeds_limit'. User needs to contact PesaPal to increase their account limit.

## Backlog
- P2: Granular loading spinners per input field during AI generation
- P3: Route modularization (refactor server.py 2400+ lines into routes/)
- P3: Team accounts, mobile app, offline mode, Swahili UI
