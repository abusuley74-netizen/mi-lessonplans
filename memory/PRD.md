# MiLesson Plan - Product Requirements Document

## Overview
AI-powered lesson plan generator for Tanzanian teachers (Zanzibar + Mainland).

## Architecture
- **Frontend**: React.js + Tailwind + Custom CSS | **Backend**: FastAPI (Python) | **DB**: MongoDB
- **AI**: GPT-5.2 + OpenAI TTS via Emergent LLM key | **Auth**: Emergent Google OAuth

## Implemented Features

### Core
- [x] Google OAuth, GPT-5.2 lesson generation, Zanzibar + Mainland forms
- [x] View/Print/Download lessons (sandbox-safe: fetch + data URL approach)
- [x] Free plan limit (3 lessons), MyHub with collapsible sidebar

### Scheme of Work
- [x] Zanzibar/Mainland toggle, 12-column auto-expanding table
- [x] Save to My Files, Print, Export DOCX — all sandbox-safe

### Templates (NEW)
- [x] 6 structured templates: Basic, Scientific, Geography, Mathematics, Physics, Chemistry
- [x] Each has editor with title/subject/category + contentEditable body
- [x] Geography has question inputs, Math/Physics/Chemistry use monospace font
- [x] Save to MongoDB, Export as Word (.doc) — sandbox-safe download
- [x] Premium badge on Geography/Math/Physics/Chemistry templates

### Notes & Dictation
- [x] Rich text editor (fonts, colors, formatting, undo/redo)
- [x] TTS with auto-translation to 5 languages

### My Files
- [x] Shows lessons, schemes, notes, dictations, uploads + templates
- [x] Play audio, View modal, Delete (custom confirm modal, no window.confirm)
- [x] View/Download via fetch-based sandbox-safe approach

### Profile
- [x] Picture upload (base64), displays in Header, edit name/school/location/bio

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/templates | GET | 6 default + user-saved templates |
| /api/templates | POST | Save/update template |
| /api/templates/{id} | DELETE | Delete template |
| /api/templates/{id}/export | POST | Export as Word .doc |
| /api/schemes | GET/POST/DELETE | Scheme CRUD |
| /api/schemes/{id}/view | GET | View HTML |
| /api/schemes/{id}/export | GET | Download DOCX |
| /api/lessons/generate | POST | AI lesson generation |
| /api/lessons/{id}/view | GET | View lesson HTML |
| /api/lessons/{id}/export | GET | Download lesson |
| /api/dictation/generate | POST | TTS audio |
| /api/profile/upload-picture | POST | Upload profile pic |

## Backlog
- P1: PesaPal payment (awaiting keys)
- P2: Loading spinners per input, lesson sharing
- P3: Team accounts, mobile, offline, Swahili UI
