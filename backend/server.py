from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    subscription_status: str = "free"
    subscription_expires: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LessonPlan(BaseModel):
    lesson_id: str = Field(default_factory=lambda: f"lesson_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    syllabus: str  # "Zanzibar" or "Tanzania Mainland"
    subject: str
    grade: str
    topic: str
    content: Dict[str, Any]
    form_data: Dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LessonPlanCreate(BaseModel):
    syllabus: str
    subject: str
    grade: str
    topic: str
    form_data: Optional[Dict[str, Any]] = {}

class GenerateLessonRequest(BaseModel):
    syllabus: str
    subject: str
    grade: str
    topic: str
    form_data: Optional[Dict[str, Any]] = {}

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> User:
    """Extract and validate user from session token"""
    # Check cookie first, then Authorization header
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry with timezone awareness
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id from Emergent Auth for a session token"""
    data = await request.json()
    session_id = data.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            auth_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=500, detail="Authentication failed")
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info if needed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "subscription_status": "free",
            "subscription_expires": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    # Get user data to return
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"user": user_doc, "message": "Session created"}

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user including custom picture"""
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    if not user_doc:
        return user.model_dump()
    return user_doc

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ==================== AI LESSON GENERATION ====================

async def generate_lesson_with_ai(syllabus: str, subject: str, grade: str, topic: str) -> Dict[str, Any]:
    """Generate lesson plan content using GPT-5.2 via Emergent LLM key"""
    import asyncio
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        logger.warning("No EMERGENT_LLM_KEY found, using fallback content")
        return get_fallback_lesson_content(syllabus, subject, grade, topic)
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"lesson_{uuid.uuid4().hex[:8]}",
            system_message="You are an expert Tanzanian education curriculum designer. Create practical lesson plans. Be concise but comprehensive."
        ).with_model("openai", "gpt-5.2")
        
        if syllabus == "Zanzibar":
            prompt = f"""Create a detailed lesson plan for the Zanzibar syllabus with the following details:
- Subject: {subject}
- Grade: {grade}
- Topic: {topic}

Generate the lesson plan in JSON format with these exact keys:
{{
    "generalOutcome": "The general learning outcome for this lesson",
    "mainTopic": "The main topic being covered",
    "subTopic": "The specific sub-topic",
    "specificOutcome": "Specific learning outcomes students should achieve",
    "learningResources": "List of teaching materials and resources needed",
    "references": "Textbook references and other materials",
    "introductionActivities": {{
        "time": "5-10 minutes",
        "teachingActivities": "What the teacher will do during introduction",
        "learningActivities": "What students will do during introduction",
        "assessment": "How to assess understanding during introduction"
    }},
    "newKnowledgeActivities": {{
        "time": "25-30 minutes",
        "teachingActivities": "Main teaching activities for new content",
        "learningActivities": "Student activities for learning new content",
        "assessment": "Assessment methods for new knowledge"
    }},
    "teacherEvaluation": "",
    "pupilWork": "Classwork or activities for students",
    "remarks": ""
}}

Provide practical, actionable content appropriate for {grade} students in Tanzania."""
        else:  # Tanzania Mainland
            prompt = f"""Create a detailed lesson plan for the Tanzania Mainland syllabus with the following details:
- Subject: {subject}
- Grade/Level: {grade}
- Topic: {topic}

Generate the lesson plan in JSON format with these exact keys:
{{
    "mainCompetence": "The main competence to be developed",
    "specificCompetence": "Specific competences students will achieve",
    "mainActivity": "The main learning activity",
    "specificActivity": "Specific activities for students",
    "teachingResources": "Teaching and learning resources needed",
    "references": "Textbook and material references",
    "stages": {{
        "introduction": {{
            "time": "5-10 minutes",
            "teachingActivities": "Teacher activities for introduction",
            "learningActivities": "Student activities for introduction",
            "assessment": "Assessment criteria for introduction"
        }},
        "competenceDevelopment": {{
            "time": "15-20 minutes",
            "teachingActivities": "Teacher activities for competence development",
            "learningActivities": "Student activities for competence development",
            "assessment": "Assessment criteria"
        }},
        "design": {{
            "time": "10-15 minutes",
            "teachingActivities": "Design phase teacher activities",
            "learningActivities": "Design phase student activities",
            "assessment": "Assessment for design phase"
        }},
        "realisation": {{
            "time": "10-15 minutes",
            "teachingActivities": "Realisation phase teacher activities",
            "learningActivities": "Realisation phase student activities",
            "assessment": "Assessment for realisation"
        }}
    }},
    "remarks": ""
}}

Provide practical, actionable content appropriate for {grade} students in Tanzania."""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON from response
        import json
        import re
        
        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            content = json.loads(json_match.group())
            # Force teacherEvaluation and remarks to be empty for teacher input
            content["teacherEvaluation"] = ""
            content["remarks"] = ""
            return content
        else:
            logger.warning("Could not parse AI response, using fallback")
            return get_fallback_lesson_content(syllabus, subject, grade, topic)
            
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        return get_fallback_lesson_content(syllabus, subject, grade, topic)

def get_fallback_lesson_content(syllabus: str, subject: str, grade: str, topic: str) -> Dict[str, Any]:
    """Fallback lesson content when AI is unavailable"""
    if syllabus == "Zanzibar":
        return {
            "generalOutcome": f"Students will understand the key concepts of {topic}",
            "mainTopic": topic,
            "subTopic": f"Introduction to {topic}",
            "specificOutcome": f"Students will be able to explain and apply concepts of {topic}",
            "learningResources": "Textbook, whiteboard, markers, visual aids, worksheets",
            "references": f"{subject} textbook for {grade}, Teacher's guide",
            "introductionActivities": {
                "time": "10 minutes",
                "teachingActivities": "Review previous lesson, introduce new topic with questions",
                "learningActivities": "Answer questions, share prior knowledge",
                "assessment": "Oral questioning to gauge prior knowledge"
            },
            "newKnowledgeActivities": {
                "time": "25 minutes",
                "teachingActivities": "Explain key concepts, demonstrate with examples, guide practice",
                "learningActivities": "Listen, take notes, practice exercises, ask questions",
                "assessment": "Monitor practice, provide feedback"
            },
            "teacherEvaluation": "",
            "pupilWork": "Complete practice exercises in notebook",
            "remarks": ""
        }
    else:
        return {
            "mainCompetence": f"Develop understanding and application of {topic}",
            "specificCompetence": f"Students will analyze and apply {topic} concepts",
            "mainActivity": f"Interactive exploration of {topic}",
            "specificActivity": "Group discussion, individual practice, presentations",
            "teachingResources": "Textbook, charts, worksheets, visual aids",
            "references": f"{subject} syllabus for {grade}, Teacher's manual",
            "stages": {
                "introduction": {
                    "time": "10 minutes",
                    "teachingActivities": "Greet students, review previous lesson, introduce topic",
                    "learningActivities": "Respond to questions, connect to prior knowledge",
                    "assessment": "Q&A to assess readiness"
                },
                "competenceDevelopment": {
                    "time": "20 minutes",
                    "teachingActivities": "Explain concepts, demonstrate, guide activities",
                    "learningActivities": "Listen, participate, practice in groups",
                    "assessment": "Observe participation, check understanding"
                },
                "design": {
                    "time": "10 minutes",
                    "teachingActivities": "Assign task, provide guidance",
                    "learningActivities": "Plan and design solutions/responses",
                    "assessment": "Review designs, provide feedback"
                },
                "realisation": {
                    "time": "10 minutes",
                    "teachingActivities": "Facilitate presentations, summarize",
                    "learningActivities": "Present work, discuss findings",
                    "assessment": "Evaluate presentations and understanding"
                }
            },
            "remarks": ""
        }

# ==================== LESSON ROUTES ====================

@api_router.post("/lessons/generate")
async def generate_lesson(
    request: GenerateLessonRequest,
    user: User = Depends(get_current_user)
):
    """Generate a new lesson plan using AI"""
    # Check subscription for free users (limit 3 lessons)
    if user.subscription_status == "free":
        lesson_count = await db.lesson_plans.count_documents({"user_id": user.user_id})
        if lesson_count >= 3:
            raise HTTPException(
                status_code=403, 
                detail="Free plan limit reached. Please subscribe to generate more lessons."
            )
    
    # Generate lesson content
    content = await generate_lesson_with_ai(
        request.syllabus,
        request.subject,
        request.grade,
        request.topic
    )
    
    # Create lesson plan
    lesson = LessonPlan(
        user_id=user.user_id,
        title=request.topic,
        syllabus=request.syllabus,
        subject=request.subject,
        grade=request.grade,
        topic=request.topic,
        content=content,
        form_data=request.form_data or {}
    )
    
    lesson_doc = lesson.model_dump()
    lesson_doc["created_at"] = lesson_doc["created_at"].isoformat()
    lesson_doc["updated_at"] = lesson_doc["updated_at"].isoformat()
    
    await db.lesson_plans.insert_one(lesson_doc)
    
    # Return without _id
    lesson_doc.pop("_id", None)
    return lesson_doc

@api_router.get("/lessons")
async def get_lessons(user: User = Depends(get_current_user)):
    """Get all lessons for the current user"""
    lessons = await db.lesson_plans.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"lessons": lessons}

@api_router.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: str, user: User = Depends(get_current_user)):
    """Get a specific lesson"""
    lesson = await db.lesson_plans.find_one(
        {"lesson_id": lesson_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return lesson

@api_router.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: str, user: User = Depends(get_current_user)):
    """Delete a lesson"""
    result = await db.lesson_plans.delete_one(
        {"lesson_id": lesson_id, "user_id": user.user_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return {"message": "Lesson deleted"}

# ==================== SUBSCRIPTION ROUTES (MOCKED) ====================

@api_router.get("/subscription/plans")
async def get_plans():
    """Get available subscription plans"""
    return {
        "plans": [
            {
                "id": "monthly",
                "name": "Monthly Plan",
                "price": 4999,
                "currency": "TZS",
                "period": "month",
                "features": [
                    "Unlimited lesson plans",
                    "Priority support",
                    "Export to PDF/Word",
                    "Scheme of Work generator"
                ]
            },
            {
                "id": "yearly",
                "name": "Yearly Plan",
                "price": 40000,
                "currency": "TZS",
                "period": "year",
                "features": [
                    "Everything in Monthly",
                    "Save 33%",
                    "Early access to new features",
                    "Custom templates"
                ]
            }
        ]
    }

@api_router.post("/subscription/subscribe")
async def subscribe(request: Request, user: User = Depends(get_current_user)):
    """Subscribe to a plan (MOCKED - will integrate PesaPal later)"""
    data = await request.json()
    plan_id = data.get("plan_id")
    
    if plan_id not in ["monthly", "yearly"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    # Mock subscription - in production, this would integrate with PesaPal
    if plan_id == "monthly":
        expires = datetime.now(timezone.utc) + timedelta(days=30)
    else:
        expires = datetime.now(timezone.utc) + timedelta(days=365)
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "subscription_status": "active",
            "subscription_expires": expires.isoformat()
        }}
    )
    
    return {
        "message": "Subscription activated (DEMO MODE)",
        "note": "This is a demo. Real payment will be integrated with PesaPal.",
        "expires": expires.isoformat()
    }

# ==================== NOTES ROUTES ====================

@api_router.get("/notes")
async def get_notes(user: User = Depends(get_current_user)):
    """Get all notes for the current user"""
    notes = await db.notes.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"notes": notes}

@api_router.post("/notes")
async def create_note(request: Request, user: User = Depends(get_current_user)):
    """Create a new note"""
    data = await request.json()
    note = {
        "note_id": f"note_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "title": data.get("title", "Untitled Note"),
        "content": data.get("content", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notes.insert_one(note)
    note.pop("_id", None)
    return note

@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str, user: User = Depends(get_current_user)):
    """Delete a note"""
    result = await db.notes.delete_one({"note_id": note_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted"}

# ==================== DICTATION ROUTES ====================

@api_router.get("/dictations")
async def get_dictations(user: User = Depends(get_current_user)):
    """Get all dictations for the current user"""
    dictations = await db.dictations.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"dictations": dictations}

@api_router.post("/dictations")
async def save_dictation(request: Request, user: User = Depends(get_current_user)):
    """Save a dictation record"""
    data = await request.json()
    dictation = {
        "dictation_id": f"dict_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "title": data.get("title", "Untitled Dictation"),
        "text": data.get("text", ""),
        "language": data.get("language", "en-GB"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.dictations.insert_one(dictation)
    dictation.pop("_id", None)
    return dictation

@api_router.post("/dictation/generate")
async def generate_dictation_audio(request: Request, user: User = Depends(get_current_user)):
    """Generate audio from text using OpenAI TTS via Emergent LLM Key"""
    from fastapi.responses import Response as FastAPIResponse
    from emergentintegrations.llm.openai import OpenAITextToSpeech
    
    data = await request.json()
    text = data.get("text", "")
    language = data.get("language", "en-GB")
    
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    
    words = text.strip().split()
    if len(words) > 200:
        raise HTTPException(status_code=400, detail="Text exceeds 200 word limit")
    
    # Map language codes to appropriate TTS voices
    voice_map = {
        "en-GB": "nova",
        "sw": "onyx",
        "ar": "echo",
        "tr": "fable",
        "fr": "shimmer",
    }
    voice = voice_map.get(language, "alloy")
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="TTS service not configured")
    
    try:
        # If non-English language selected, translate text first
        tts_text = text
        if language != "en-GB":
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            lang_names = {"sw": "Swahili", "ar": "Arabic", "tr": "Turkish", "fr": "French"}
            target_lang = lang_names.get(language, "English")
            
            chat = LlmChat(
                api_key=api_key,
                session_id=f"translate_{uuid.uuid4().hex[:8]}",
                system_message=f"You are a translator. Translate the following text to {target_lang}. Return ONLY the translated text, nothing else."
            ).with_model("openai", "gpt-5.2")
            
            translation = await chat.send_message(UserMessage(text=text))
            tts_text = translation.strip()
            logger.info(f"Translated to {target_lang}: {tts_text[:50]}...")
        
        tts = OpenAITextToSpeech(api_key=api_key)
        audio_bytes = await tts.generate_speech(
            text=tts_text,
            model="tts-1",
            voice=voice,
            response_format="mp3",
            speed=1.0
        )
        
        return FastAPIResponse(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"inline; filename=dictation_{language}.mp3"}
        )
    except Exception as e:
        logger.error(f"TTS generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate audio: {str(e)}")

@api_router.delete("/dictations/{dictation_id}")
async def delete_dictation(dictation_id: str, user: User = Depends(get_current_user)):
    """Delete a dictation"""
    result = await db.dictations.delete_one({"dictation_id": dictation_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dictation not found")
    return {"message": "Dictation deleted"}

# ==================== UPLOADS ROUTES ====================

@api_router.get("/uploads")
async def get_uploads(user: User = Depends(get_current_user)):
    """Get all uploads for the current user"""
    uploads = await db.uploads.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"uploads": uploads}

@api_router.post("/uploads")
async def upload_file(request: Request, user: User = Depends(get_current_user)):
    """Upload a file"""
    from fastapi import UploadFile, File, Form
    
    form = await request.form()
    file = form.get("file")
    name = form.get("name", "Untitled")
    file_type = form.get("type", "unknown")
    size = form.get("size", 0)
    
    upload = {
        "upload_id": f"upload_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "name": name,
        "type": file_type,
        "size": int(size),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # In production, save file to cloud storage (S3, GCS, etc.)
    # For now, just save the metadata
    await db.uploads.insert_one(upload)
    upload.pop("_id", None)
    return upload

@api_router.delete("/uploads/{upload_id}")
async def delete_upload(upload_id: str, user: User = Depends(get_current_user)):
    """Delete an upload"""
    result = await db.uploads.delete_one({"upload_id": upload_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Upload not found")
    return {"message": "Upload deleted"}

# ==================== SCHEME OF WORK ROUTES ====================

@api_router.post("/schemes")
async def save_scheme(request: Request, user: User = Depends(get_current_user)):
    """Save a scheme of work"""
    data = await request.json()
    
    scheme = {
        "scheme_id": f"scheme_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "syllabus": data.get("syllabus", "Zanzibar"),
        "school": data.get("school", ""),
        "teacher": data.get("teacher", ""),
        "subject": data.get("subject", ""),
        "year": data.get("year", ""),
        "term": data.get("term", ""),
        "class_name": data.get("class", ""),
        "competencies": data.get("competencies", []),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.schemes.insert_one(scheme)
    scheme.pop("_id", None)
    return scheme

@api_router.get("/schemes")
async def get_schemes(user: User = Depends(get_current_user)):
    """Get all schemes for the current user"""
    schemes = await db.schemes.find(
        {"user_id": user.user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"schemes": schemes}

@api_router.delete("/schemes/{scheme_id}")
async def delete_scheme(scheme_id: str, user: User = Depends(get_current_user)):
    """Delete a scheme of work"""
    result = await db.schemes.delete_one({"scheme_id": scheme_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return {"message": "Scheme deleted"}


@api_router.get("/schemes/{scheme_id}/export")
async def export_scheme_docx(scheme_id: str, user: User = Depends(get_current_user)):
    """Export a scheme of work as a downloadable .doc file"""
    from fastapi.responses import Response as FastAPIResponse
    
    scheme = await db.schemes.find_one({"scheme_id": scheme_id, "user_id": user.user_id}, {"_id": 0})
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    
    cols = ["Main Competence", "Specific Competences", "Learning Activities", "Specific Activities",
            "Month", "Week", "Periods", "Methods", "Resources", "Assessment", "References", "Remarks"]
    col_keys = ["main", "specific", "activities", "specificActivities", "month", "week", "periods",
                "methods", "resources", "assessment", "references", "remarks"]
    
    rows_html = ""
    for row in scheme.get("competencies", []):
        cells = "".join(f'<td style="border:1px solid #000;padding:5px 4px;vertical-align:top;">{row.get(k, "")}</td>' for k in col_keys)
        rows_html += f"<tr>{cells}</tr>"
    
    html = f"""<html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8">
    <style>
      body {{ font-family: 'Times New Roman', serif; font-size: 11pt; }}
      table {{ border-collapse: collapse; width: 100%; }}
      th, td {{ border: 1px solid #000; padding: 4px 6px; vertical-align: top; font-size: 9pt; }}
      th {{ background-color: #3498db; color: white; text-align: center; }}
    </style></head><body>
    <h1 style="text-align:center;">SCHEME OF WORK</h1>
    <h2 style="text-align:center;color:#555;">{scheme.get('syllabus', '').upper()}</h2>
    <table style="width:100%;margin-bottom:15px;">
      <tr><td style="font-weight:bold;width:150px;">School:</td><td>{scheme.get('school', '')}</td></tr>
      <tr><td style="font-weight:bold;">Teacher:</td><td>{scheme.get('teacher', '')}</td></tr>
      <tr><td style="font-weight:bold;">Subject:</td><td>{scheme.get('subject', '')}</td></tr>
      <tr><td style="font-weight:bold;">Year:</td><td>{scheme.get('year', '')} &nbsp; Term: {scheme.get('term', '')} &nbsp; Class: {scheme.get('class_name', '')}</td></tr>
    </table>
    <table style="width:100%;font-size:9pt;">
      <thead><tr>{"".join(f'<th>{c}</th>' for c in cols)}</tr></thead>
      <tbody>{rows_html}</tbody>
    </table>
    </body></html>"""
    
    subject = scheme.get("subject", "untitled")
    syllabus = scheme.get("syllabus", "")
    filename = f"Scheme_of_Work_{subject}_{syllabus}.doc"
    
    return FastAPIResponse(
        content=f'\ufeff{html}'.encode('utf-8'),
        media_type="application/msword",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@api_router.get("/schemes/{scheme_id}/view")
async def view_scheme_html(scheme_id: str, user: User = Depends(get_current_user)):
    """View a scheme of work as rendered HTML"""
    from fastapi.responses import HTMLResponse
    
    scheme = await db.schemes.find_one({"scheme_id": scheme_id, "user_id": user.user_id}, {"_id": 0})
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    
    cols = ["Main Competence", "Specific Competences", "Learning Activities", "Specific Activities",
            "Month", "Week", "Periods", "Methods", "Resources", "Assessment", "References", "Remarks"]
    col_keys = ["main", "specific", "activities", "specificActivities", "month", "week", "periods",
                "methods", "resources", "assessment", "references", "remarks"]
    
    rows_html = ""
    for row in scheme.get("competencies", []):
        cells = "".join(f'<td>{row.get(k, "")}</td>' for k in col_keys)
        rows_html += f"<tr>{cells}</tr>"
    
    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><title>Scheme of Work - {scheme.get('subject','')}</title>
    <style>
      * {{ margin:0; padding:0; box-sizing:border-box; }}
      body {{ font-family:'Times New Roman',serif; padding:30px; background:#fff; }}
      h1 {{ text-align:center; font-size:22pt; margin-bottom:5px; }}
      h2 {{ text-align:center; font-size:14pt; color:#555; margin-bottom:20px; }}
      .info {{ margin-bottom:20px; }}
      .info td {{ padding:4px 10px; }}
      .info td:first-child {{ font-weight:bold; width:130px; }}
      .data {{ width:100%; border-collapse:collapse; font-size:10pt; }}
      .data th {{ background:#3498db; color:#fff; padding:8px 5px; border:1px solid #999; text-align:center; font-size:9pt; }}
      .data td {{ border:1px solid #999; padding:6px 5px; vertical-align:top; }}
      .actions {{ text-align:center; margin:25px 0; }}
      .actions button {{ padding:10px 24px; margin:0 8px; border:none; border-radius:5px; font-weight:bold; cursor:pointer; font-size:14px; }}
      .print-btn {{ background:#4a5568; color:#fff; }}
      .download-btn {{ background:#9b59b6; color:#fff; }}
      @media print {{ .actions {{ display:none; }} @page {{ size:landscape; margin:10mm; }} }}
    </style></head><body>
    <h1>SCHEME OF WORK</h1>
    <h2>{scheme.get('syllabus','').upper()}</h2>
    <table class="info">
      <tr><td>School:</td><td>{scheme.get('school','')}</td></tr>
      <tr><td>Teacher:</td><td>{scheme.get('teacher','')}</td></tr>
      <tr><td>Subject:</td><td>{scheme.get('subject','')}</td></tr>
      <tr><td>Year:</td><td>{scheme.get('year','')} &nbsp;&nbsp; Term: {scheme.get('term','')} &nbsp;&nbsp; Class: {scheme.get('class_name','')}</td></tr>
    </table>
    <table class="data">
      <thead><tr>{"".join(f'<th>{c}</th>' for c in cols)}</tr></thead>
      <tbody>{rows_html}</tbody>
    </table>
    <div class="actions">
      <button class="print-btn" onclick="window.print()">Print</button>
      <button class="download-btn" onclick="window.location.href=window.location.href.replace('/view','/export')">Download DOCX</button>
    </div>
    </body></html>"""
    
    return HTMLResponse(content=html)

@api_router.get("/lessons/{lesson_id}/export")
async def export_lesson_txt(lesson_id: str, user: User = Depends(get_current_user)):
    """Export a lesson plan as downloadable text file"""
    from fastapi.responses import Response as FastAPIResponse
    
    lesson = await db.lesson_plans.find_one({"lesson_id": lesson_id, "user_id": user.user_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    content = lesson.get("content", {})
    text = f"{'='*70}\n{'LESSON PLAN':^70}\n{'='*70}\n\n"
    text += f"SYLLABUS: {lesson.get('syllabus','')}\nSUBJECT: {lesson.get('subject','')}\n"
    text += f"GRADE/CLASS: {lesson.get('grade','')}\nTOPIC: {lesson.get('topic','')}\n"
    text += f"DATE: {lesson.get('created_at','')}\n\n"
    
    for key, val in content.items():
        if isinstance(val, str):
            label = key.replace('_', ' ').title()
            text += f"{label}: {val}\n"
        elif isinstance(val, dict):
            label = key.replace('_', ' ').title()
            text += f"\n--- {label} ---\n"
            for k2, v2 in val.items():
                text += f"  {k2}: {v2}\n"
    
    text += f"\nGenerated by MiLesson Plan\n"
    
    filename = f"{lesson.get('subject','lesson')}_{lesson.get('topic','plan')}.txt"
    return FastAPIResponse(
        content=text.encode('utf-8'),
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@api_router.get("/lessons/{lesson_id}/view")
async def view_lesson_html(lesson_id: str, user: User = Depends(get_current_user)):
    """View a lesson plan as rendered HTML page with print/download"""
    from fastapi.responses import HTMLResponse
    
    lesson = await db.lesson_plans.find_one({"lesson_id": lesson_id, "user_id": user.user_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    content = lesson.get("content", {})
    syllabus = lesson.get("syllabus", "")
    
    sections = ""
    for key, val in content.items():
        if isinstance(val, str):
            label = key.replace('_', ' ').title()
            sections += f'<div style="margin-bottom:10px;"><strong>{label}:</strong> {val}</div>'
        elif isinstance(val, dict):
            label = key.replace('_', ' ').title()
            inner = "".join(f'<p><strong>{k}:</strong> {v}</p>' for k, v in val.items())
            sections += f'<div style="margin:15px 0;padding:10px;border:1px solid #ccc;border-radius:4px;"><h3>{label}</h3>{inner}</div>'
    
    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lesson Plan - {lesson.get('topic','')}</title>
    <style>
      * {{ margin:0; padding:0; box-sizing:border-box; }}
      body {{ font-family:'Times New Roman',serif; padding:30px; background:#fff; font-size:12pt; line-height:1.5; }}
      h1 {{ text-align:center; font-size:18pt; margin-bottom:5px; border-bottom:2px solid #000; padding-bottom:10px; }}
      .info td {{ padding:4px 10px; }} .info td:first-child {{ font-weight:bold; width:100px; }}
      .actions {{ text-align:center; margin:25px 0; }}
      .actions button {{ padding:10px 24px; margin:0 8px; border:none; border-radius:5px; font-weight:bold; cursor:pointer; font-size:14px; }}
      .print-btn {{ background:#4a5568; color:#fff; }}
      .download-btn {{ background:#2D5A27; color:#fff; }}
      @media print {{ .actions {{ display:none; }} }}
    </style></head><body>
    <h1>{syllabus.upper()} LESSON PLAN</h1>
    <table class="info" style="width:100%;margin:15px 0;">
      <tr><td>Subject:</td><td>{lesson.get('subject','')}</td><td>Grade:</td><td>{lesson.get('grade','')}</td></tr>
      <tr><td>Topic:</td><td colspan="3">{lesson.get('topic','')}</td></tr>
    </table>
    {sections}
    <div class="actions">
      <button class="print-btn" onclick="window.print()">Print</button>
      <button class="download-btn" onclick="window.location.href=window.location.href.replace('/view','/export')">Download</button>
    </div>
    </body></html>"""
    
    return HTMLResponse(content=html)

# ==================== PROFILE ROUTES ====================

@api_router.post("/profile/upload-picture")
async def upload_profile_picture(request: Request, user: User = Depends(get_current_user)):
    """Upload a profile picture (stores as base64 in MongoDB)"""
    import base64
    
    form = await request.form()
    file = form.get("file")
    
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    contents = await file.read()
    
    # Limit to 2MB
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 2MB.")
    
    # Detect content type
    content_type = file.content_type or "image/jpeg"
    if content_type not in ["image/jpeg", "image/png", "image/webp", "image/gif"]:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, GIF images allowed")
    
    # Store as data URI
    b64 = base64.b64encode(contents).decode('utf-8')
    picture_data_uri = f"data:{content_type};base64,{b64}"
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"custom_picture": picture_data_uri}}
    )
    
    return {"picture": picture_data_uri, "message": "Profile picture updated"}

@api_router.get("/profile")
async def get_profile(user: User = Depends(get_current_user)):
    """Get full profile including custom picture"""
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc

@api_router.put("/profile")
async def update_profile(request: Request, user: User = Depends(get_current_user)):
    """Update profile fields"""
    data = await request.json()
    allowed_fields = {"name", "school", "location", "bio"}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": update_data}
        )
    
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return user_doc

# ==================== UTILITY ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "MiLesson Plan API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
