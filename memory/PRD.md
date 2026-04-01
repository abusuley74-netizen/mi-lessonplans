# MiLesson Plan - Product Requirements Document

## Overview
MiLesson Plan is an AI-powered lesson plan generator for teachers in Tanzania, supporting both Zanzibar and Tanzania Mainland syllabi.

## Original Problem Statement
Build mi-lessonPlan app based on provided zip file with:
- AI-powered lesson plan generation
- User authentication
- Two syllabus formats
- Lesson history management
- Subscription model

## User Choices & Inputs
1. **AI Integration**: Emergent LLM key with GPT-5.2 (no extra API key needed)
2. **Database**: MongoDB (adapted from original MySQL)
3. **Authentication**: Emergent-managed Google OAuth
4. **Payments**: Mocked for now (PesaPal keys to be provided later)

## Architecture

### Tech Stack
- **Frontend**: React.js + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: GPT-5.2 via Emergent LLM key
- **Auth**: Emergent Google OAuth

### Key Files
- `/app/backend/server.py` - Main API server
- `/app/frontend/src/App.js` - React router & auth provider
- `/app/frontend/src/pages/Dashboard.js` - Lesson generator
- `/app/frontend/src/pages/MyHub.js` - Lesson history
- `/app/frontend/src/components/LessonForm.js` - Form component
- `/app/frontend/src/components/LessonPreview.js` - Lesson display

## Core Requirements (Static)

### User Personas
1. **Teachers (Primary Users)**
   - Create lesson plans quickly
   - Choose syllabus format (Zanzibar/Mainland)
   - Save and manage lessons
   - Export/print lessons

2. **School Administrators**
   - Manage team subscriptions
   - Access lesson templates

### Features
| Feature | Priority | Status |
|---------|----------|--------|
| Google OAuth Login | P0 | ✅ Done |
| Lesson Generator Form | P0 | ✅ Done |
| AI Lesson Generation | P0 | ✅ Done |
| Zanzibar Syllabus Format | P0 | ✅ Done |
| Tanzania Mainland Format | P0 | ✅ Done |
| Lesson Preview | P0 | ✅ Done |
| Print/Download/Share | P0 | ✅ Done |
| MyHub (Lesson History) | P0 | ✅ Done |
| Subscription Modal | P1 | ✅ Done (Mocked) |
| PesaPal Integration | P1 | ⏳ Pending (User keys) |

## What's Been Implemented

### April 1, 2026 - MVP Complete
- [x] Emergent Google OAuth authentication
- [x] GPT-5.2 AI lesson generation via Emergent LLM key
- [x] Zanzibar syllabus format with all fields
- [x] Tanzania Mainland syllabus format with stages
- [x] Lesson form with subject/grade/topic selection
- [x] Lesson preview with formatted output
- [x] Print, download (TXT), and share functionality
- [x] MyHub with lesson history, search, filter
- [x] Subscription plans page (mocked payment)
- [x] Free plan limit (3 lessons)
- [x] Organic & earthy design theme

## Prioritized Backlog

### P1 - High Priority
- [ ] PesaPal payment integration (awaiting user keys)
- [ ] PDF export with proper formatting
- [ ] Word document export

### P2 - Medium Priority
- [ ] Scheme of Work generator
- [ ] Custom lesson templates
- [ ] Lesson sharing between users
- [ ] Email notifications

### P3 - Future
- [ ] Team/school accounts
- [ ] Mobile app
- [ ] Offline mode
- [ ] Multi-language support (Swahili)

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /api/health | GET | No | Health check |
| /api/auth/session | POST | No | Exchange session_id for token |
| /api/auth/me | GET | Yes | Get current user |
| /api/auth/logout | POST | Yes | Logout |
| /api/lessons/generate | POST | Yes | Generate new lesson |
| /api/lessons | GET | Yes | List user's lessons |
| /api/lessons/{id} | GET | Yes | Get specific lesson |
| /api/lessons/{id} | DELETE | Yes | Delete lesson |
| /api/subscription/plans | GET | No | Get plan options |
| /api/subscription/subscribe | POST | Yes | Subscribe (mocked) |

## Next Tasks
1. Add PesaPal integration when user provides keys
2. Implement proper PDF export
3. Add Scheme of Work generator feature
