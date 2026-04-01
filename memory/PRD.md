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
- **Frontend**: React.js + Custom CSS (matching original design)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: GPT-5.2 via Emergent LLM key
- **Auth**: Emergent Google OAuth

### Key Files
- `/app/backend/server.py` - Main API server
- `/app/frontend/src/App.js` - React router & auth provider
- `/app/frontend/src/pages/Dashboard.js` - Main dashboard with form switcher
- `/app/frontend/src/components/ZanzibarLessonForm.js` - Zanzibar syllabus form
- `/app/frontend/src/components/TanzaniaMainlandLessonForm.js` - Tanzania Mainland form
- `/app/frontend/src/components/LessonForm.css` - Custom styling for forms
- `/app/frontend/src/pages/MyHub.js` - Lesson history

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

### Form Structure - Zanzibar Syllabus
| Section | Fields |
|---------|--------|
| Basic Info | Syllabus, Subject, Grade, Topic |
| Student Info | Day/Date, Session, Class, Periods, Time |
| Enrollment | Girls Enrolled/Present, Boys Enrolled/Present, Totals |
| Content | General Outcome, Main Topic, Sub Topic, Specific Outcome |
| Resources | Learning Resources, References |
| Lesson Development | Introduction (Time, Teaching, Learning, Assessment) |
| | Building New Knowledge (Time, Teaching, Learning, Assessment) |
| Evaluation | Teacher's Evaluation, Pupil's Work, Remarks |

### Form Structure - Tanzania Mainland Syllabus
| Section | Fields |
|---------|--------|
| Basic Info | Subject, Grade, Topic |
| Student Info | Day/Date, Session, Class, Periods, Time |
| Enrollment | Girls Enrolled/Present, Boys Enrolled/Present, Totals |
| Competence | Main Competence, Specific Competence |
| Activities | Main Activity, Specific Activity |
| Resources | Teaching Resources, References |
| Process | 1. Introduction, 2. Competence Development, 3. Design, 4. Realisation |
| Evaluation | Remarks |

## What's Been Implemented

### April 1, 2026 - MVP + Form Update + View Improvements
- [x] Emergent Google OAuth authentication
- [x] GPT-5.2 AI lesson generation via Emergent LLM key
- [x] **Zanzibar syllabus form** - exact layout from original code:
  - Student info table with English/Swahili labels
  - Enrollment section with auto-calculated totals
  - All content fields (General Outcome, Main Topic, etc.)
  - Lesson development table with 5 columns
  - Teacher evaluation section
- [x] **Tanzania Mainland form** - 4-stage competence-based format
- [x] **Smart AI detection**: 
  - Empty content fields → AI Mode (generates lesson content)
  - Filled content fields → Manual Mode (previews entered data)
- [x] Loading spinners in each field during AI generation
- [x] **AI leaves empty**: Teacher's Evaluation & Remarks (for real teacher input)
- [x] **Improved Print/Download** - proper CSS styling for print output
- [x] **Better MyHub View** - styled modal with dark headers, structured layout
- [x] MyHub with lesson history, search, filter
- [x] Subscription plans page (mocked payment)
- [x] Free plan limit (3 lessons)

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
- [ ] Multi-language support (Swahili UI)

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
| /api/subscription/plans | GET | No | Get plan options |
| /api/subscription/subscribe | POST | Yes | Subscribe (mocked) |

## Next Tasks
1. User can provide PesaPal keys for real payment integration
2. Implement proper PDF export with form layout
3. Add Scheme of Work generator feature
