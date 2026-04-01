# MiLesson Plan - Product Requirements Document

## Overview
MiLesson Plan is an AI-powered lesson plan generator for teachers in Tanzania, supporting both Zanzibar and Tanzania Mainland syllabi.

## Original Problem Statement
Build mi-lessonPlan app based on provided zip file with AI-powered lesson plan generation, user authentication, two syllabus formats, lesson history, subscription model, MyHub tools (Dictation TTS, Notes, Files, Scheme of Work).

## Architecture
- **Frontend**: React.js + Tailwind + Custom CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: GPT-5.2 via Emergent LLM key
- **TTS**: OpenAI TTS + GPT-5.2 translation (5 languages)
- **Auth**: Emergent Google OAuth

## What's Been Implemented

### Core Features
- [x] Emergent Google OAuth
- [x] GPT-5.2 AI lesson generation (Zanzibar + Mainland)
- [x] AI leaves Teacher's Evaluation & Remarks empty
- [x] Full lesson header in View/Print/Download
- [x] MyHub with collapsible sidebar
- [x] Free plan limit (3 lessons)

### Scheme of Work
- [x] Zanzibar / Tanzania Mainland toggle
- [x] 12-column table with auto-expanding cells (no scroll, fully visible for printing)
- [x] Pagination + Add Row (jumps to last page)
- [x] Save to My Files (MongoDB)
- [x] Print (opens formatted print window, landscape)
- [x] Export as DOCX (downloadable .doc)

### Notes
- [x] Rich text editor (font family/size, color, bold/italic/underline/strikethrough, headings, lists, alignment, undo/redo, horizontal rule)

### Dictation TTS
- [x] Real OpenAI TTS via Emergent LLM key
- [x] Auto-translates to target language via GPT-5.2 before TTS
- [x] 5 languages: British English, Swahili, Arabic, Turkish, French

### My Files
- [x] Shows ALL types: lessons, schemes, notes, dictations, uploads
- [x] 5 stat cards
- [x] Play button for dictations (regenerates audio)
- [x] View modal for notes
- [x] Delete actually deletes for ALL types
- [x] Filter by type

### Profile
- [x] Profile picture upload (stored as base64 in MongoDB)
- [x] Custom picture displays in Header
- [x] Edit name, school, location, bio

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/session | POST | Exchange session_id for token |
| /api/auth/me | GET | Current user + custom_picture |
| /api/lessons/generate | POST | AI lesson generation |
| /api/lessons | GET | List lessons |
| /api/lessons/{id} | DELETE | Delete lesson |
| /api/schemes | POST | Save scheme of work |
| /api/schemes | GET | List schemes |
| /api/schemes/{id} | DELETE | Delete scheme |
| /api/dictation/generate | POST | TTS audio (mp3) |
| /api/dictations | GET/POST | List/save dictations |
| /api/dictations/{id} | DELETE | Delete dictation |
| /api/notes | GET/POST | List/create notes |
| /api/notes/{id} | DELETE | Delete note |
| /api/uploads | GET/POST | List/create uploads |
| /api/uploads/{id} | DELETE | Delete upload |
| /api/profile | GET/PUT | Get/update profile |
| /api/profile/upload-picture | POST | Upload profile pic |
| /api/subscription/subscribe | POST | Subscribe (MOCKED) |

## Prioritized Backlog
### P1
- [ ] PesaPal payment integration (awaiting user keys)
- [ ] Custom lesson templates (awaiting user content)

### P2
- [ ] Loading spinners per input field during AI generation
- [ ] Lesson sharing between users

### P3
- [ ] Team/school accounts, Mobile app, Offline mode, Swahili UI
