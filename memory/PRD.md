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
- **MyFiles Manager** with custom delete modals, blob-based downloads, audio playback
- **Profile Settings** with custom picture upload
- **Templates System** with 6 types:
  - Basic Template (Free)
  - Scientific Template (Free)
  - Geography Template (Premium) - with image upload + questions
  - Mathematics Template (Premium) - with math keyboard + Tanzania formulas
  - Physics Template (Premium) - with physics keyboard + Tanzania formulas
  - Chemistry Template (Premium) - with chemistry keyboard + Tanzania formulas
- **Subscription System** (Mock PesaPal - Basic TZS 9,999 / Premium TZS 19,999)
- **Sonner Toast Notifications** - All window.alert() calls replaced for iframe sandbox compatibility
- **Sandbox-safe Downloads** - Fetch-to-blob approach for document exports

## Architecture
```
/app
├── backend/
│   └── server.py          # FastAPI (auth, AI, templates, TTS, CRUD)
├── frontend/src/
│   ├── components/
│   │   ├── Templates.js         # Template grid + generic editor
│   │   ├── MathTemplate.js      # Math editor w/ keyboard
│   │   ├── PhysicsTemplate.js   # Physics editor w/ keyboard
│   │   ├── ChemistryTemplate.js # Chemistry editor w/ keyboard
│   │   ├── MathKeyboard.js      # Math symbols keyboard
│   │   ├── PhysicsKeyboard.js   # Physics symbols keyboard
│   │   ├── ChemistryKeyboard.js # Chemistry symbols keyboard
│   │   ├── SpecialTemplates.css # Premium keyboard styling
│   │   ├── Dictation.js, CreateNotes.js, SchemeOfWork.js
│   │   ├── MyFiles.js, ProfileSettings.js, Header.js
│   │   └── SubscriptionModal.js
│   ├── contexts/ (AuthContext.js)
│   ├── pages/ (MyHub.js, SubscribePage.js)
│   └── App.js (with Sonner Toaster)
└── memory/ (PRD.md, test_credentials.md)
```

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
- [x] Basic/Scientific/Geography templates
- [x] Premium Math/Physics/Chemistry templates with custom keyboards
- [x] Tanzania Syllabus Formula reference panels (Form 1-6)
- [x] All window.alert() → Sonner toast notifications
- [x] Sandbox iframe compatibility (no confirm/alert/window.open)

## Backlog
- P1: PesaPal real payment integration (blocked on API keys)
- P2: Granular loading spinners per input field during AI generation
- P3: Team accounts, mobile app, offline mode, Swahili UI
