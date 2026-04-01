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
    """Get current authenticated user"""
    return user.model_dump()

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
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        logger.warning("No EMERGENT_LLM_KEY found, using fallback content")
        return get_fallback_lesson_content(syllabus, subject, grade, topic)
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"lesson_{uuid.uuid4().hex[:8]}",
            system_message="You are an expert education curriculum designer specializing in Tanzanian education systems. You create detailed, practical lesson plans following official syllabus guidelines."
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
    "teacherEvaluation": "How the teacher will evaluate the lesson's success",
    "pupilWork": "Classwork or activities for students",
    "remarks": "Additional notes or observations"
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
    "remarks": "Additional notes and observations"
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
            "teacherEvaluation": "Assess student understanding through questions and exercises",
            "pupilWork": "Complete practice exercises in notebook",
            "remarks": "Adjust pace based on student understanding"
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
            "remarks": "Differentiate instruction based on student needs"
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
