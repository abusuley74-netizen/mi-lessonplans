# MiLesson Plan - Product Requirements Document

## Overview
AI-powered lesson planning platform for Tanzanian teachers, supporting Tanzania Mainland & Zanzibar syllabi. Built with React + FastAPI + MongoDB.

## Core Features (Implemented)
- **Google OAuth Login** (Emergent-managed)
- **AI Lesson Plan Generator** (GPT-5.2 via Emergent LLM Key)
- **MyHub Dashboard** with sidebar navigation
- **Dictation Tool** (OpenAI TTS with GPT-5.2 auto-translation to Swahili/Arabic/French)
- **Rich Text Notes Editor** (CreateNotes with formatting toolbar)
- **Scheme of Work Generator** with AI, Add Row, Save, Export DOCX
- **MyFiles Manager** with custom delete modals, blob-based downloads, audio playback, share buttons
- **Profile Settings** with custom picture upload
- **6 Specialized Template Editors:**
  - **Basic** - Generic contentEditable editor (Free)
  - **Scientific** - Vertical split: notes on left + 3 image uploads on right (Free)
  - **Geography** - 4 image upload cards + dynamic questions section (Premium)
  - **Mathematics** - Monospace editor + dark math keyboard + Tanzania Syllabus formulas (Premium)
  - **Physics** - Monospace editor + dark physics keyboard + Tanzania Syllabus formulas (Premium)
  - **Chemistry** - Monospace editor + dark chemistry keyboard + Tanzania Syllabus formulas (Premium)
- **Subscription System** (Mock PesaPal - Basic TZS 9,999 / Premium TZS 19,999)
- **Sonner Toast Notifications** - All window.alert() calls replaced
- **Sandbox-safe Downloads** - Fetch-to-blob for document exports
- **Shared Link Pipeline** (NEW):
  - Teachers share any resource (lesson, note, scheme, template, dictation) via shareable link
  - Visitors access /shared/{code} without logging in
  - Paid links gated with mock payment (PesaPal integration pending)
  - Auto-expires after 1 download to prevent abuse
  - Rating system (1-5 stars + optional comment)
  - Teacher "My Shared Links" management in MyHub sidebar
  - Share buttons on all file cards in MyFiles

## Architecture
```
/app
├── backend/
│   └── server.py              # FastAPI (auth, AI, templates, TTS, CRUD, shared links)
├── frontend/src/
│   ├── components/
│   │   ├── Templates.js           # Template grid + generic editor + routing
│   │   ├── MathTemplate.js        # Math editor w/ keyboard
│   │   ├── PhysicsTemplate.js     # Physics editor w/ keyboard
│   │   ├── ChemistryTemplate.js   # Chemistry editor w/ keyboard
│   │   ├── GeographyTemplate.js   # Geography editor w/ images + questions
│   │   ├── ScientificTemplate.js  # Scientific editor w/ split layout
│   │   ├── MathKeyboard.js        # Math symbols keyboard
│   │   ├── PhysicsKeyboard.js     # Physics symbols keyboard
│   │   ├── ChemistryKeyboard.js   # Chemistry symbols keyboard
│   │   ├── SpecialTemplates.css   # Keyboard styling (Math/Physics/Chemistry)
│   │   ├── GeographyTemplate.css  # Geography template styling
│   │   ├── ScientificTemplate.css # Scientific template styling
│   │   ├── ShareModal.js          # Share configuration modal (NEW)
│   │   ├── SharedView.js          # Public visitor view (NEW)
│   │   ├── MySharedLinks.js       # Teacher's link management (NEW)
│   │   ├── Dictation.js, CreateNotes.js, SchemeOfWork.js
│   │   ├── MyFiles.js, ProfileSettings.js, Header.js
│   │   └── SubscriptionModal.js
│   ├── contexts/ (AuthContext.js)
│   ├── pages/ (MyHub.js, SubscribePage.js)
│   └── App.js (with Sonner Toaster + public /shared/:code route)
└── memory/ (PRD.md, test_credentials.md)
```

## DB Collections
- `users`: {user_id, email, name, picture, custom_picture, subscription_status}
- `user_sessions`: {user_id, session_token, expires_at}
- `lesson_plans`: {lesson_id, user_id, title, syllabus, subject, grade, topic, content, form_data}
- `notes`: {note_id, user_id, title, content}
- `dictations`: {dictation_id, user_id, title, text, language}
- `schemes`: {scheme_id, user_id, syllabus, school, teacher, subject, year, term, competencies}
- `templates`: {template_id, user_id, name, type, content, is_default}
- `uploads`: {upload_id, user_id, name, type, size}
- `shared_links`: {link_code, resource_type, resource_id, teacher_id, teacher_name, title, description, is_paid, price, status, download_count, max_downloads, ratings, avg_rating, total_ratings}

## 3rd Party Integrations
- Emergent Google Auth (login)
- OpenAI GPT-5.2 (AI generation, translation) via Emergent LLM Key
- OpenAI TTS tts-1 (dictation audio) via Emergent LLM Key
- PesaPal (payments) - MOCKED, awaiting user API keys

## Completed (as of Apr 1, 2026)
- [x] Google OAuth login flow
- [x] AI lesson plan generation (Mainland + Zanzibar)
- [x] MyHub dashboard with all sidebar tools
- [x] Dictation with TTS + auto-translation
- [x] Rich Text Notes editor
- [x] Scheme of Work with AI + CRUD + Export
- [x] MyFiles with audio/notes/schemes + delete modals + blob downloads
- [x] Profile picture upload
- [x] Basic template (generic editor)
- [x] Scientific template (vertical split: notes + 3 image uploads)
- [x] Geography template (4 image uploads + dynamic questions)
- [x] Mathematics template (keyboard + Tanzania formulas)
- [x] Physics template (keyboard + Tanzania formulas)
- [x] Chemistry template (keyboard + Tanzania formulas)
- [x] All window.alert() -> Sonner toast notifications
- [x] Sandbox iframe compatibility
- [x] Shared Link Pipeline: create, view, download, auto-expire, rate, manage
- [x] Share buttons on MyFiles resource cards
- [x] Saved templates visible in MyFiles
- [x] My Shared Links management in MyHub sidebar

## Backlog
- P1: PesaPal real payment integration (blocked on API keys)
- P2: Granular loading spinners per input field during AI generation
- P3: Team accounts, mobile app, offline mode, Swahili UI
