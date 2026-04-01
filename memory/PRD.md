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
- **TTS**: OpenAI TTS via Emergent LLM key (tts-1 model)
- **Auth**: Emergent Google OAuth

### Key Files
- `/app/backend/server.py` - Main API server
- `/app/frontend/src/App.js` - React router & auth provider
- `/app/frontend/src/pages/Dashboard.js` - Main dashboard with form switcher
- `/app/frontend/src/pages/MyHub.js` - Hub with sidebar navigation
- `/app/frontend/src/components/ZanzibarLessonForm.js` - Zanzibar syllabus form
- `/app/frontend/src/components/TanzaniaMainlandLessonForm.js` - Tanzania Mainland form
- `/app/frontend/src/components/SchemeOfWorkForm.js` - Scheme of Work table form
- `/app/frontend/src/components/SchemeOfWork.css` - Scheme of Work styles
- `/app/frontend/src/components/CreateNotes.js` - Rich text editor for notes
- `/app/frontend/src/components/Dictation.js` - AI TTS dictation tool
- `/app/frontend/src/components/LessonForm.css` - Custom styling for forms

## What's Been Implemented

### April 1, 2026 - MVP + All Features
- [x] Emergent Google OAuth authentication
- [x] GPT-5.2 AI lesson generation via Emergent LLM key
- [x] **Zanzibar syllabus form** - exact layout from original code
- [x] **Tanzania Mainland form** - 4-stage competence-based format
- [x] **Smart AI detection** for auto-generation
- [x] **AI leaves empty**: Teacher's Evaluation & Remarks (for real teacher input)
- [x] **Full lesson header in View/Print/Download**
- [x] **Redesigned MyHub** with sidebar navigation
- [x] **Scheme of Work** - Full table form with 12 columns, pagination, add rows (from user's zip code)
- [x] **Create Notes** - Rich text editor with font family, font size, text color, bold/italic/underline/strikethrough, headings, lists, alignment, undo/redo
- [x] **Dictation (AI TTS)** - Real OpenAI TTS via Emergent LLM key, 5 languages (British English, Swahili, Arabic, Turkish, French), 200 word limit, mp3 download
- [x] **My Files, Upload Materials, My Activities, Payment Settings, Profile Settings**
- [x] Free plan limit (3 lessons)

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /api/health | GET | No | Health check |
| /api/auth/session | POST | No | Exchange session_id for token |
| /api/auth/me | GET | Yes | Get current user |
| /api/auth/logout | POST | Yes | Logout |
| /api/lessons/generate | POST | Yes | Generate new lesson with AI |
| /api/lessons | GET | Yes | List user's lessons |
| /api/lessons/{id} | GET | Yes | Get specific lesson |
| /api/lessons/{id} | DELETE | Yes | Delete lesson |
| /api/dictation/generate | POST | Yes | Generate TTS audio (returns mp3) |
| /api/dictations | GET | Yes | List dictations |
| /api/dictations | POST | Yes | Save dictation record |
| /api/notes | GET | Yes | List notes |
| /api/notes | POST | Yes | Create note |
| /api/notes/{id} | DELETE | Yes | Delete note |
| /api/subscription/plans | GET | No | Get plan options |
| /api/subscription/subscribe | POST | Yes | Subscribe (MOCKED) |

## Prioritized Backlog

### P0 - Immediate
- All P0 tasks completed

### P1 - High Priority
- [ ] PesaPal payment integration (awaiting user keys)
- [ ] Custom lesson templates (awaiting user content)

### P2 - Medium Priority
- [ ] Loading spinners per input field during AI generation
- [ ] Lesson sharing between users
- [ ] PDF export with proper formatting
- [ ] Word document export

### P3 - Future
- [ ] Team/school accounts
- [ ] Mobile app
- [ ] Offline mode
- [ ] Multi-language support (Swahili UI)
