# MiLesson Plan - Product Requirements Document

## Overview
MiLesson Plan is an AI-powered lesson plan generator for teachers in Tanzania, supporting both Zanzibar and Tanzania Mainland syllabi.

## Original Problem Statement
Build mi-lessonPlan app based on provided zip file with:
- AI-powered lesson plan generation
- User authentication
- Two syllabus formats (Zanzibar & Tanzania Mainland)
- Lesson history management
- Subscription model

## User Choices & Inputs
1. **AI Integration**: Emergent LLM key with GPT-5.2 (no extra API key needed)
2. **Database**: MongoDB (adapted from original MySQL)
3. **Authentication**: Emergent-managed Google OAuth
4. **Payments**: Mocked for now (PesaPal keys to be provided later)

## Architecture

### Tech Stack
- **Frontend**: React.js + Custom CSS + Tailwind
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: GPT-5.2 via Emergent LLM key
- **TTS**: OpenAI TTS via Emergent LLM key (tts-1 model) + GPT-5.2 translation
- **Auth**: Emergent Google OAuth

### Key Files
- `/app/backend/server.py` - Main API server (~817 lines)
- `/app/frontend/src/App.js` - React router & auth provider
- `/app/frontend/src/pages/Dashboard.js` - Main dashboard with form switcher
- `/app/frontend/src/pages/MyHub.js` - Hub with collapsible sidebar
- `/app/frontend/src/components/ZanzibarLessonForm.js` - Zanzibar syllabus form
- `/app/frontend/src/components/TanzaniaMainlandLessonForm.js` - Tanzania Mainland form
- `/app/frontend/src/components/SchemeOfWorkForm.js` - Scheme of Work with syllabus toggle
- `/app/frontend/src/components/CreateNotes.js` - Rich text editor
- `/app/frontend/src/components/Dictation.js` - AI TTS dictation
- `/app/frontend/src/components/MyFiles.js` - All files with Play/View
- `/app/frontend/src/components/ProfileSettings.js` - Profile with pic upload
- `/app/frontend/src/components/Header.js` - Header with custom profile pic

## What's Been Implemented

### April 1, 2026
- [x] Emergent Google OAuth authentication
- [x] GPT-5.2 AI lesson generation
- [x] Zanzibar & Tanzania Mainland syllabus forms
- [x] AI leaves Teacher's Evaluation & Remarks empty
- [x] Full lesson header in View/Print/Download
- [x] MyHub with collapsible sidebar
- [x] Scheme of Work with Zanzibar/Tanzania Mainland toggle, 12-column table, pagination
- [x] Create Notes rich text editor (font family/size, color, formatting, undo/redo)
- [x] Dictation TTS with translation for 5 languages
- [x] My Files showing ALL file types (lessons, notes, dictations, uploads) with Play/View
- [x] Profile picture upload (stored as base64) displayed in Header
- [x] Profile editing (name, school, location, bio)
- [x] Free plan limit (3 lessons)

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /api/auth/session | POST | No | Exchange session_id for token |
| /api/auth/me | GET | Yes | Get current user + custom_picture |
| /api/auth/logout | POST | Yes | Logout |
| /api/lessons/generate | POST | Yes | Generate lesson with AI |
| /api/lessons | GET | Yes | List lessons |
| /api/lessons/{id} | DELETE | Yes | Delete lesson |
| /api/dictation/generate | POST | Yes | Generate TTS audio (mp3) |
| /api/dictations | GET/POST | Yes | List/save dictations |
| /api/notes | GET/POST | Yes | List/create notes |
| /api/profile | GET/PUT | Yes | Get/update profile |
| /api/profile/upload-picture | POST | Yes | Upload profile pic |
| /api/subscription/plans | GET | No | Get plans |
| /api/subscription/subscribe | POST | Yes | Subscribe (MOCKED) |

## Prioritized Backlog

### P1 - High Priority
- [ ] PesaPal payment integration (awaiting user keys)
- [ ] Custom lesson templates (awaiting user content)

### P2 - Medium Priority
- [ ] Loading spinners per input field during AI generation
- [ ] PDF/Word export improvements
- [ ] Lesson sharing between users

### P3 - Future
- [ ] Team/school accounts, Mobile app, Offline mode, Swahili UI
