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
- `/app/backend/server.py` - Main API server
- `/app/frontend/src/App.js` - React router & auth provider
- `/app/frontend/src/pages/Dashboard.js` - Main dashboard with form switcher
- `/app/frontend/src/pages/MyHub.js` - Hub with collapsible sidebar navigation
- `/app/frontend/src/components/ZanzibarLessonForm.js` - Zanzibar syllabus form
- `/app/frontend/src/components/TanzaniaMainlandLessonForm.js` - Tanzania Mainland form
- `/app/frontend/src/components/SchemeOfWorkForm.js` - Scheme of Work table form
- `/app/frontend/src/components/CreateNotes.js` - Rich text editor for notes
- `/app/frontend/src/components/Dictation.js` - AI TTS dictation with translation

## What's Been Implemented

### April 1, 2026
- [x] Emergent Google OAuth authentication
- [x] GPT-5.2 AI lesson generation via Emergent LLM key
- [x] Zanzibar & Tanzania Mainland syllabus forms
- [x] AI leaves Teacher's Evaluation & Remarks empty
- [x] Full lesson header in View/Print/Download
- [x] MyHub with **collapsible sidebar** (toggle button)
- [x] Scheme of Work - 12-column table form with pagination
- [x] Create Notes - Rich text editor (font family/size, color, formatting, undo/redo)
- [x] Dictation TTS - Real OpenAI TTS + GPT-5.2 translation for 5 languages
- [x] My Files, Upload Materials, My Activities, Payment/Profile Settings
- [x] Free plan limit (3 lessons)

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
