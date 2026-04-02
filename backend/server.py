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

# PesaPal configuration
PESAPAL_CONSUMER_KEY = os.environ.get('PESAPAL_CONSUMER_KEY', 'Sp9V76FmwL0dS4qAaVcL7PoIuH/gkInm')
PESAPAL_CONSUMER_SECRET = os.environ.get('PESAPAL_CONSUMER_SECRET', 'ukStYbZKDpjgb6Rgk/AP2bFuy8I=')
PESAPAL_CALLBACK_URL = os.environ.get('PESAPAL_CALLBACK_URL', 'https://Mi-LessonPlan.site/listentowebsitepaymentsipn.php')
PESAPAL_USE_SANDBOX = os.environ.get('PESAPAL_USE_SANDBOX', 'false').lower() in ['true', '1', 'yes']
PESAPAL_BASE_URL = 'https://cybqa.pesapal.com' if PESAPAL_USE_SANDBOX else 'https://www.pesapal.com'

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
    subscription_plan: str = "free"
    subscription_expires: Optional[datetime] = None
    lesson_period_start: Optional[str] = None
    lesson_period_count: int = 0
    referral_code: Optional[str] = None
    referred_by: Optional[str] = None
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

class Referral(BaseModel):
    referral_id: str = Field(default_factory=lambda: f"ref_{uuid.uuid4().hex[:12]}")
    teacher_id: str
    teacher_name: str
    teacher_email: str
    admin_id: str
    admin_name: str
    date_joined: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    subscription_plan: str = "free"
    monthly_price: int = 0
    active_months: int = 0
    inactive_months: int = 0
    status: str = "active"
    total_commission: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReferralMetrics(BaseModel):
    total_teachers: int = 0
    total_commission: float = 0.0
    active_teachers: int = 0
    inactive_teachers: int = 0

class ReferralCreate(BaseModel):
    teacher_id: str
    teacher_name: str
    teacher_email: str
    admin_id: str
    admin_name: str
    subscription_plan: str = "free"
    monthly_price: int = 0

class Admin(BaseModel):
    admin_id: str
    email: str
    name: str
    role: str = "admin"
    is_active: bool = True
    tasks: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminTask(BaseModel):
    task_id: str
    admin_id: str
    task_name: str
    is_enabled: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminSession(BaseModel):
    admin_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminCreate(BaseModel):
    email: str
    name: str
    role: str = "admin"
    tasks: List[str] = []

class AdminLoginModel(BaseModel):
    email: str
    password: str

class PesaPalTransaction(BaseModel):
    merchant_reference: str
    user_id: str
    email: str
    plan_id: str
    amount: int
    currency: str = "TZS"
    status: str = "pending"
    pesapal_tracking_id: Optional[str] = None
    ipn_traces: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserManagementModel(BaseModel):
    user_id: str
    action: str
    reason: Optional[str] = None


# ==================== ADMIN AUTH HELPERS ====================

async def get_current_admin(request: Request) -> Admin:
    """Extract and validate admin from session token"""
    session_token = request.cookies.get("admin_session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.admin_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    admin_doc = await db.admins.find_one(
        {"admin_id": session_doc["admin_id"]},
        {"_id": 0}
    )
    
    if not admin_doc:
        raise HTTPException(status_code=401, detail="Admin not found")
    
    return Admin(**admin_doc)

def check_admin_permission(admin: Admin, required_permission: str) -> bool:
    """Check if admin has permission for a specific action"""
    if admin.role == "super_admin":
        return True
    permission_map = {
        "user_management": ["user_management"],
        "content_management": ["content_management"],
        "subscription_management": ["subscription_management"],
        "template_management": ["template_management"],
        "analytics": ["analytics", "advanced_reports"],
        "referral_registry": ["referral_registry"],
        "refer_and_earn": ["refer_and_earn"],
        "admin_profiles": ["admin_profiles"],
        "communication": ["communication"],
        "promo_banner": ["promo_banner"]
    }
    required_tasks = permission_map.get(required_permission, [])
    return any(task in admin.tasks for task in required_tasks)

# ==================== ADMIN AUTH ROUTES ====================

@api_router.post("/admin/auth/login")
async def admin_login(request: Request, response: Response):
    """Admin login with dual system support"""
    data = await request.json()
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    # Hardcoded admin credentials
    valid_admins = {
        "admin@milessonplan.com": {"password": "password", "admin_id": "admin_system", "name": "System Administrator"},
        "RedJohn@admin.com": {"password": "1993redjohn", "admin_id": "admin_redjohn", "name": "Red John"},
    }
    
    cred = valid_admins.get(email)
    if not cred or password != cred["password"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    admin = Admin(
        admin_id=cred["admin_id"],
        email=email,
        name=cred["name"],
        role="super_admin",
        tasks=[]
    )
    
    session_token = f"admin_{uuid.uuid4().hex[:32]}"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=8)
    
    session_doc = {
        "admin_id": admin.admin_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.admin_sessions.delete_many({"admin_id": admin.admin_id})
    await db.admin_sessions.insert_one(session_doc)
    
    # Upsert admin into DB so get_current_admin can find them
    admin_dict = admin.model_dump()
    admin_dict["updated_at"] = datetime.now(timezone.utc)
    await db.admins.update_one(
        {"admin_id": admin.admin_id},
        {"$set": admin_dict},
        upsert=True
    )
    
    response.set_cookie(
        key="admin_session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=8 * 60 * 60
    )
    
    return {"admin": admin.model_dump(), "session_token": session_token, "message": "Admin login successful"}

@api_router.get("/admin/auth/me")
async def admin_me(admin: Admin = Depends(get_current_admin)):
    return admin.model_dump()

@api_router.post("/admin/auth/logout")
async def admin_logout(request: Request, response: Response):
    session_token = request.cookies.get("admin_session_token")
    if session_token:
        await db.admin_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="admin_session_token", path="/")
    return {"message": "Admin logged out"}

# ==================== ADMIN MANAGEMENT ROUTES ====================

@api_router.post("/admin/admins")
async def create_admin(admin_data: AdminCreate, current_admin: Admin = Depends(get_current_admin)):
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admins can create admin accounts")
    existing = await db.admins.find_one({"email": admin_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Admin with this email already exists")
    admin = Admin(
        admin_id=f"admin_{uuid.uuid4().hex[:12]}",
        email=admin_data.email,
        name=admin_data.name,
        role=admin_data.role,
        tasks=admin_data.tasks
    )
    await db.admins.insert_one(admin.model_dump())
    return {"message": "Admin created", "admin": admin.model_dump()}

@api_router.get("/admin/admins")
async def get_admins(current_admin: Admin = Depends(get_current_admin)):
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admins can view admin list")
    admins = await db.admins.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"admins": admins}

@api_router.put("/admin/admins/{admin_id}")
async def update_admin(admin_id: str, admin_data: AdminCreate, current_admin: Admin = Depends(get_current_admin)):
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admins can update admin accounts")
    update_data = {"name": admin_data.name, "role": admin_data.role, "tasks": admin_data.tasks, "updated_at": datetime.now(timezone.utc)}
    result = await db.admins.update_one({"admin_id": admin_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    updated = await db.admins.find_one({"admin_id": admin_id}, {"_id": 0})
    return {"message": "Admin updated", "admin": updated}

@api_router.delete("/admin/admins/{admin_id}")
async def delete_admin(admin_id: str, current_admin: Admin = Depends(get_current_admin)):
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admins can delete admin accounts")
    if admin_id == current_admin.admin_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    result = await db.admins.delete_one({"admin_id": admin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {"message": "Admin deleted"}

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/admin/dashboard")
async def get_dashboard_data(current_admin: Admin = Depends(get_current_admin)):
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"subscription_status": "active"})
    blocked_users = await db.users.count_documents({"is_blocked": True})
    free_users = await db.users.count_documents({"subscription_plan": "free"})
    basic_users = await db.users.count_documents({"subscription_plan": "basic"})
    premium_users = await db.users.count_documents({"subscription_plan": "premium"})
    enterprise_users = await db.users.count_documents({"subscription_plan": {"$in": ["enterprise", "master"]}})
    basic_revenue = basic_users * 9999
    premium_revenue = premium_users * 19999
    enterprise_revenue = enterprise_users * 29999
    total_revenue = basic_revenue + premium_revenue + enterprise_revenue
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_users = await db.users.count_documents({"created_at": {"$gte": seven_days_ago}})
    recent_lessons = await db.lesson_plans.count_documents({"created_at": {"$gte": seven_days_ago}})
    total_referrals = await db.referrals.count_documents({})
    total_commission = await db.referrals.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$total_commission"}}}
    ]).to_list(1)
    total_commission = total_commission[0]["total"] if total_commission else 0
    return {
        "overview": {"total_users": total_users, "active_users": active_users, "blocked_users": blocked_users, "total_revenue": total_revenue},
        "subscriptions": {"free": free_users, "basic": basic_users, "premium": premium_users, "master": enterprise_users},
        "recent_activity": {"new_users_7d": recent_users, "lessons_created_7d": recent_lessons},
        "referrals": {"total_referrals": total_referrals, "total_commission": total_commission}
    }

@api_router.get("/admin/dashboard/navigation")
async def get_navigation(current_admin: Admin = Depends(get_current_admin)):
    all_sections = [
        {"id": "dashboard", "name": "Dashboard", "icon": "chart", "path": "/admin/dashboard"},
        {"id": "referral_registry", "name": "Referral Registry", "icon": "handshake", "path": "/admin/referral-registry"},
        {"id": "refer_and_earn", "name": "Refer and Earn", "icon": "money", "path": "/admin/refer-and-earn"},
        {"id": "user_management", "name": "User Management", "icon": "users", "path": "/admin/users"},
        {"id": "content_management", "name": "Content Management", "icon": "book", "path": "/admin/content"},
        {"id": "analytics", "name": "Analytics & Reports", "icon": "chart", "path": "/admin/analytics"},
        {"id": "subscription_management", "name": "Subscription Management", "icon": "card", "path": "/admin/subscriptions"},
        {"id": "template_management", "name": "Template Management", "icon": "template", "path": "/admin/templates"},
        {"id": "communication", "name": "Communication", "icon": "message", "path": "/admin/communication"},
        {"id": "promo_banner", "name": "Promo Banner", "icon": "target", "path": "/admin/promo"},
        {"id": "admin_profiles", "name": "Admin Profiles", "icon": "users", "path": "/admin/profiles"}
    ]
    if current_admin.role == "super_admin":
        return {"navigation": all_sections}
    allowed_sections = [s for s in all_sections if check_admin_permission(current_admin, s["id"])]
    return {"navigation": allowed_sections}

# ==================== USER MANAGEMENT ROUTES ====================

@api_router.get("/admin/users")
async def get_users(current_admin: Admin = Depends(get_current_admin), skip: int = 0, limit: int = 50, search: str = "", status: str = "all"):
    if not check_admin_permission(current_admin, "user_management"):
        raise HTTPException(status_code=403, detail="No permission for user management")
    query = {}
    if search:
        query["$or"] = [{"email": {"$regex": search, "$options": "i"}}, {"name": {"$regex": search, "$options": "i"}}]
    if status == "blocked":
        query["is_blocked"] = True
    elif status == "active":
        query["subscription_status"] = "active"
    elif status == "inactive":
        query["subscription_status"] = {"$ne": "active"}
    users = await db.users.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    total = await db.users.count_documents(query)
    return {"users": users, "total": total, "skip": skip, "limit": limit}

@api_router.put("/admin/users/{user_id}")
async def manage_user(user_id: str, action_data: UserManagementModel, current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "user_management"):
        raise HTTPException(status_code=403, detail="No permission for user management")
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = {"updated_at": datetime.now(timezone.utc)}
    if action_data.action == "block":
        update_data["is_blocked"] = True
        update_data["blocked_reason"] = action_data.reason
    elif action_data.action == "unblock":
        update_data["is_blocked"] = False
        update_data["blocked_reason"] = None
    elif action_data.action == "suspend":
        update_data["subscription_status"] = "suspended"
    elif action_data.action == "activate":
        update_data["subscription_status"] = "active"
    elif action_data.action == "delete":
        update_data["is_deleted"] = True
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    await db.users.update_one({"user_id": user_id}, {"$set": update_data})
    return {"message": f"User {action_data.action}d successfully"}

@api_router.get("/admin/users/{user_id}/details")
async def get_user_details(user_id: str, current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "user_management"):
        raise HTTPException(status_code=403, detail="No permission")
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    lesson_count = await db.lesson_plans.count_documents({"user_id": user_id})
    referral_count = await db.referrals.count_documents({"admin_id": user_id})
    link_count = await db.shared_links.count_documents({"teacher_id": user_id})
    return {"user": user, "stats": {"lesson_count": lesson_count, "referral_count": referral_count, "shared_links_count": link_count}}

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/admin/analytics/overview")
async def get_analytics_overview(current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "analytics"):
        raise HTTPException(status_code=403, detail="No permission for analytics")
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    user_growth = await db.users.aggregate([
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]).to_list(30)
    lesson_trends = await db.lesson_plans.aggregate([
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]).to_list(30)
    subscription_dist = await db.users.aggregate([
        {"$group": {"_id": "$subscription_plan", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(10)
    popular_subjects = await db.lesson_plans.aggregate([
        {"$group": {"_id": "$subject", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]).to_list(10)
    return {"user_growth": user_growth, "lesson_trends": lesson_trends, "subscription_distribution": subscription_dist, "popular_subjects": popular_subjects}

@api_router.get("/admin/analytics/revenue")
async def get_revenue_analytics(current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "advanced_reports"):
        raise HTTPException(status_code=403, detail="No permission")
    revenue_data = await db.users.aggregate([
        {"$match": {"subscription_plan": {"$in": ["basic", "premium", "master", "enterprise"]}}},
        {"$group": {"_id": "$subscription_plan", "count": {"$sum": 1},
            "revenue": {"$sum": {"$switch": {"branches": [
                {"case": {"$eq": ["$subscription_plan", "basic"]}, "then": 9999},
                {"case": {"$eq": ["$subscription_plan", "premium"]}, "then": 19999},
                {"case": {"$in": ["$subscription_plan", ["enterprise", "master"]]}, "then": 29999}
            ], "default": 0}}}}}
    ]).to_list(10)
    return {"revenue_breakdown": revenue_data}

@api_router.get("/admin/analytics/content")
async def get_content_analytics(current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "analytics"):
        raise HTTPException(status_code=403, detail="No permission")
    content_stats = {
        "lessons": await db.lesson_plans.count_documents({}),
        "notes": await db.notes.count_documents({}),
        "schemes": await db.schemes.count_documents({}),
        "templates": await db.templates.count_documents({}),
        "dictations": await db.dictations.count_documents({}),
        "shared_links": await db.shared_links.count_documents({})
    }
    active_users = await db.lesson_plans.aggregate([
        {"$group": {"_id": "$user_id", "lesson_count": {"$sum": 1}}},
        {"$sort": {"lesson_count": -1}},
        {"$limit": 10},
        {"$lookup": {"from": "users", "localField": "_id", "foreignField": "user_id", "as": "user_info"}},
        {"$unwind": "$user_info"},
        {"$project": {"user_id": "$_id", "name": "$user_info.name", "email": "$user_info.email", "lesson_count": 1}}
    ]).to_list(10)
    return {"content_stats": content_stats, "most_active_users": active_users}

# ==================== REFERRAL MANAGEMENT ROUTES ====================

@api_router.get("/admin/referrals")
async def get_all_referrals(current_admin: Admin = Depends(get_current_admin), skip: int = 0, limit: int = 100):
    if not check_admin_permission(current_admin, "referral_registry"):
        raise HTTPException(status_code=403, detail="No permission")
    referrals = await db.referrals.find({}, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    total = await db.referrals.count_documents({})
    total_commission = sum(r.get("total_commission", 0) for r in referrals)
    return {"referrals": referrals, "total": total, "total_commission": total_commission}

@api_router.get("/admin/referrals/stats")
async def get_referral_stats(current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "referral_registry"):
        raise HTTPException(status_code=403, detail="No permission")
    admin_stats = await db.referrals.aggregate([
        {"$group": {"_id": "$admin_id", "admin_name": {"$first": "$admin_name"}, "total_referrals": {"$sum": 1}, "total_commission": {"$sum": "$total_commission"}, "active_referrals": {"$sum": {"$cond": [{"$eq": ["$status", "active"]}, 1, 0]}}}},
        {"$sort": {"total_commission": -1}}
    ]).to_list(50)
    return {"admin_stats": admin_stats}

# ==================== SUBSCRIPTION MANAGEMENT ROUTES ====================

@api_router.get("/admin/subscriptions")
async def get_subscription_data(current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "subscription_management"):
        raise HTTPException(status_code=403, detail="No permission")
    plans = await get_plans()
    stats = await db.users.aggregate([
        {"$group": {"_id": "$subscription_plan", "count": {"$sum": 1}, "active": {"$sum": {"$cond": [{"$eq": ["$subscription_status", "active"]}, 1, 0]}}}},
        {"$sort": {"count": -1}}
    ]).to_list(10)
    return {"plans": plans["plans"], "stats": stats}

@api_router.put("/admin/subscriptions/plans")
async def update_subscription_plans(request: Request, current_admin: Admin = Depends(get_current_admin)):
    """Update subscription plan pricing (super admin only)"""
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admins can modify subscription plans")
    data = await request.json()
    return {"message": "Subscription plans updated (demo mode)"}

# ==================== CONTENT MANAGEMENT ROUTES ====================

@api_router.get("/admin/content/lessons")
async def get_content_lessons(current_admin: Admin = Depends(get_current_admin), skip: int = 0, limit: int = 50):
    if not check_admin_permission(current_admin, "content_management"):
        raise HTTPException(status_code=403, detail="No permission")
    lessons = await db.lesson_plans.find({}, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    total = await db.lesson_plans.count_documents({})
    return {"lessons": lessons, "total": total}

@api_router.delete("/admin/content/lessons/{lesson_id}")
async def delete_content_lesson(lesson_id: str, current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "content_management"):
        raise HTTPException(status_code=403, detail="No permission")
    result = await db.lesson_plans.delete_one({"lesson_id": lesson_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return {"message": "Lesson deleted"}

# ==================== COMMUNICATION ROUTES ====================

@api_router.post("/admin/communication/send")
async def send_user_message(request: Request, current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "communication"):
        raise HTTPException(status_code=403, detail="No permission")
    data = await request.json()
    notification = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "from_admin": current_admin.admin_id,
        "to_users": data.get("user_ids", []),
        "subject": data.get("subject", "Admin Message"),
        "message": data.get("message", ""),
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "type": "admin_message"
    }
    await db.notifications.insert_one(notification)
    return {"message": f"Message sent to {len(notification['to_users'])} users"}

# ==================== PROMO BANNER ROUTES ====================

@api_router.get("/admin/promo")
async def get_promo_banners(current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "promo_banner"):
        raise HTTPException(status_code=403, detail="No permission")
    banners = await db.promo_banners.find({"is_active": True}, {"_id": 0}).sort("created_at", -1).to_list(10)
    return {"banners": banners}

@api_router.post("/admin/promo")
async def create_promo_banner(request: Request, current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "promo_banner"):
        raise HTTPException(status_code=403, detail="No permission")
    data = await request.json()
    banner = {
        "banner_id": f"banner_{uuid.uuid4().hex[:12]}",
        "title": data.get("title", ""), "message": data.get("message", ""),
        "image_url": data.get("image_url", ""), "link_url": data.get("link_url", ""),
        "is_active": data.get("is_active", True),
        "created_by": current_admin.admin_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.promo_banners.insert_one(banner)
    banner.pop("_id", None)
    return {"message": "Promo banner created", "banner": banner}

@api_router.put("/admin/promo/{banner_id}")
async def update_promo_banner(banner_id: str, request: Request, current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "promo_banner"):
        raise HTTPException(status_code=403, detail="No permission")
    data = await request.json()
    update_data = {k: v for k, v in data.items() if k in ["title", "message", "image_url", "link_url", "is_active"]}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.promo_banners.update_one({"banner_id": banner_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"message": "Banner updated"}

@api_router.delete("/admin/promo/{banner_id}")
async def delete_promo_banner(banner_id: str, current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "promo_banner"):
        raise HTTPException(status_code=403, detail="No permission")
    result = await db.promo_banners.delete_one({"banner_id": banner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"message": "Banner deleted"}

# ==================== PESAPAL PAYMENT ADMIN ROUTES ====================

@api_router.get("/admin/pesapal/transactions")
async def get_pesapal_transactions(request: Request, current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "subscription_management"):
        raise HTTPException(status_code=403, detail="No permission")
    status_filter = request.query_params.get("status")
    limit = int(request.query_params.get("limit", 50))
    skip = int(request.query_params.get("skip", 0))
    query = {}
    if status_filter:
        query["status"] = status_filter.upper()
    transactions = await db.pesapal_transactions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total_count = await db.pesapal_transactions.count_documents(query)
    summary = await db.pesapal_transactions.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}, "total_amount": {"$sum": "$amount"}}}
    ]).to_list(None)
    status_summary = {item["_id"]: {"count": item["count"], "total_amount": item["total_amount"]} for item in summary}
    return {"transactions": transactions, "total_count": total_count, "status_summary": status_summary, "pagination": {"skip": skip, "limit": limit, "has_more": total_count > skip + limit}}

@api_router.get("/admin/pesapal/transactions/{merchant_reference}")
async def get_pesapal_transaction_details(merchant_reference: str, current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "subscription_management"):
        raise HTTPException(status_code=403, detail="No permission")
    transaction = await db.pesapal_transactions.find_one({"merchant_reference": merchant_reference}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    user = await db.users.find_one({"user_id": transaction["user_id"]}, {"_id": 0, "user_id": 1, "email": 1, "name": 1, "subscription_status": 1, "subscription_plan": 1})
    return {"transaction": transaction, "user": user}

@api_router.get("/admin/pesapal/analytics")
async def get_pesapal_analytics(current_admin: Admin = Depends(get_current_admin)):
    if not check_admin_permission(current_admin, "analytics"):
        raise HTTPException(status_code=403, detail="No permission")
    plan_revenue = await db.pesapal_transactions.aggregate([
        {"$match": {"status": "COMPLETED"}},
        {"$group": {"_id": "$plan_id", "total_revenue": {"$sum": "$amount"}, "transaction_count": {"$sum": 1}}}
    ]).to_list(None)
    total_transactions = await db.pesapal_transactions.count_documents({})
    completed_transactions = await db.pesapal_transactions.count_documents({"status": "COMPLETED"})
    success_rate = (completed_transactions / total_transactions * 100) if total_transactions > 0 else 0
    return {"plan_revenue": plan_revenue, "success_rate": round(success_rate, 2), "total_transactions": total_transactions, "completed_transactions": completed_transactions}


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
        is_new_user = False
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        ref_code = f"ML{uuid.uuid4().hex[:6].upper()}"
        # Check for referral code passed during signup
        ref_by_code = data.get("referral_code")
        referred_by_id = None
        if ref_by_code:
            referrer = await db.users.find_one({"referral_code": ref_by_code}, {"_id": 0})
            if referrer:
                referred_by_id = referrer["user_id"]
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "subscription_status": "free",
            "subscription_plan": "free",
            "subscription_expires": None,
            "lesson_period_start": datetime.now(timezone.utc).isoformat(),
            "lesson_period_count": 0,
            "referral_code": ref_code,
            "referred_by": referred_by_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
        is_new_user = True
    
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
    # Ensure subscription_plan is set
    if "subscription_plan" not in user_doc:
        plan = "free"
        if user_doc.get("subscription_status") == "active":
            plan = "basic"
        user_doc["subscription_plan"] = plan
    return user_doc

# ==================== FEATURE ACCESS & TIER GATING ====================

PLAN_LIMITS = {
    "free": 10,
    "basic": 50,
    "premium": None,  # unlimited
    "master": None,   # unlimited
}

PLAN_FEATURES = {
    "free": {"my-files", "profile-settings", "payment-settings", "my-activities"},
    "basic": {"my-files", "profile-settings", "payment-settings", "my-activities", "create-notes", "shared-links"},
    "premium": {"my-files", "profile-settings", "payment-settings", "my-activities", "create-notes", "shared-links", "upload-materials", "scheme-of-work", "templates", "dictation"},
    "master": {"my-files", "profile-settings", "payment-settings", "my-activities", "create-notes", "shared-links", "upload-materials", "scheme-of-work", "templates", "dictation", "refer-and-earn"},
}

def _get_user_plan(user_doc: dict) -> str:
    plan = user_doc.get("subscription_plan", "free")
    if plan == "enterprise":
        plan = "master"
    if plan not in PLAN_LIMITS:
        plan = "free"
    return plan

async def _get_lesson_usage(user_id: str, plan: str) -> dict:
    """Get lesson count for current 30-day period"""
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    period_start_str = user_doc.get("lesson_period_start") if user_doc else None
    now = datetime.now(timezone.utc)

    # Check if period needs reset (30 days elapsed or no period set)
    needs_reset = True
    if period_start_str:
        try:
            period_start = datetime.fromisoformat(period_start_str.replace("Z", "+00:00")) if isinstance(period_start_str, str) else period_start_str
            if hasattr(period_start, 'tzinfo') and period_start.tzinfo is None:
                period_start = period_start.replace(tzinfo=timezone.utc)
            if (now - period_start).days < 30:
                needs_reset = False
        except Exception:
            pass

    if needs_reset:
        period_start = now
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"lesson_period_start": now.isoformat(), "lesson_period_count": 0}}
        )
        return {"used": 0, "limit": PLAN_LIMITS.get(plan), "period_start": now.isoformat(), "days_remaining": 30}
    
    used = user_doc.get("lesson_period_count", 0) if user_doc else 0
    days_elapsed = (now - period_start).days
    days_remaining = max(0, 30 - days_elapsed)
    return {"used": used, "limit": PLAN_LIMITS.get(plan), "period_start": period_start.isoformat(), "days_remaining": days_remaining}

@api_router.get("/user/feature-access")
async def get_feature_access(user: User = Depends(get_current_user)):
    """Return which features are accessible for user's subscription tier"""
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    plan = _get_user_plan(user_doc or {})
    features = PLAN_FEATURES.get(plan, PLAN_FEATURES["free"])
    usage = await _get_lesson_usage(user.user_id, plan)
    return {
        "plan": plan,
        "features": list(features),
        "lesson_usage": usage,
    }

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
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    plan = _get_user_plan(user_doc or {})
    limit = PLAN_LIMITS.get(plan)
    
    if limit is not None:
        usage = await _get_lesson_usage(user.user_id, plan)
        if usage["used"] >= limit:
            raise HTTPException(
                status_code=403, 
                detail=f"{plan.title()} plan limit reached ({limit} lessons/month). Please upgrade to generate more lessons."
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
    
    # Increment lesson period count
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$inc": {"lesson_period_count": 1}}
    )
    
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

# ==================== REFERRAL SERVICE FUNCTIONS ====================

async def calculate_commission(plan: str, months: int) -> float:
    plan_prices = {"free": 0, "basic": 9999, "premium": 19999, "master": 29999, "enterprise": 29999}
    return plan_prices.get(plan, 0) * months * 0.3

async def update_referral_commission(referral_id: str, plan: str, months: int):
    commission = await calculate_commission(plan, months)
    await db.referrals.update_one(
        {"referral_id": referral_id},
        {"$set": {
            "subscription_plan": plan,
            "monthly_price": {"free": 0, "basic": 9999, "premium": 19999, "master": 29999, "enterprise": 29999}.get(plan, 0),
            "active_months": months, "total_commission": commission,
            "updated_at": datetime.now(timezone.utc)
        }}
    )

async def get_referral_metrics(admin_id: str) -> ReferralMetrics:
    referrals = await db.referrals.find({"admin_id": admin_id}, {"_id": 0}).to_list(1000)
    total = len(referrals)
    active = len([r for r in referrals if r.get("status") == "active"])
    return ReferralMetrics(
        total_teachers=total,
        total_commission=sum(r.get("total_commission", 0) for r in referrals),
        active_teachers=active,
        inactive_teachers=total - active
    )

async def sync_admin_referrals(admin_id: str):
    referrals = await db.referrals.find({"admin_id": admin_id}, {"_id": 0}).to_list(1000)
    for referral in referrals:
        plan = referral.get("subscription_plan", "free")
        months = referral.get("active_months", 0)
        expected = await calculate_commission(plan, months)
        if abs(referral.get("total_commission", 0) - expected) > 0.01:
            await update_referral_commission(referral["referral_id"], plan, months)

# ==================== PESAPAL PAYMENT HELPERS ====================

def _build_pesapal_request_data(reference: str, amount: int, description: str, user: User):
    first_name = (user.name or 'Customer').split(' ')[0]
    last_name = (user.name or 'Customer').split(' ')[-1] if user.name and ' ' in user.name else ''
    email = user.email or ''
    # PesaPal API v2 uses attribute-based self-closing XML
    return (
        f'<PesapalDirectOrderInfo '
        f'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
        f'xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
        f'Amount="{amount}" '
        f'Description="{description}" '
        f'Type="MERCHANT" '
        f'Reference="{reference}" '
        f'FirstName="{first_name}" '
        f'LastName="{last_name}" '
        f'Email="{email}" '
        f'PhoneNumber="" '
        f'Currency="TZS" '
        f'xmlns="http://www.pesapal.com" />'
    )

async def _create_pesapal_checkout_url(reference: str, amount: int, description: str, user: User) -> str:
    import requests as http_requests
    from requests_oauthlib import OAuth1

    endpoint = f"{PESAPAL_BASE_URL}/API/PostPesapalDirectOrderV4"
    pesapal_request_data = _build_pesapal_request_data(reference, amount, description, user)

    params = {
        'oauth_callback': PESAPAL_CALLBACK_URL,
        'pesapal_request_data': pesapal_request_data
    }
    auth = OAuth1(PESAPAL_CONSUMER_KEY, client_secret=PESAPAL_CONSUMER_SECRET, signature_type='query')

    # PesaPal API returns a 302 redirect to the checkout page
    response = http_requests.get(endpoint, params=params, auth=auth, timeout=30, allow_redirects=False)

    # 302 redirect — the Location header contains the checkout URL
    if response.status_code == 302:
        location = response.headers.get('Location', '')
        if location:
            return location
        raise HTTPException(status_code=502, detail="PesaPal returned 302 but no Location header")

    # 200 — PesaPal may return a direct URL or HTML
    if response.status_code == 200:
        response_text = response.text.strip()
        if response_text.startswith('http'):
            return response_text
        if '<!doctype' in response_text.lower() or '<html' in response_text.lower():
            return response.url
        if 'Problem' in response_text:
            raise HTTPException(status_code=502, detail=f"PesaPal error: {response_text[:200]}")

    raise HTTPException(status_code=502, detail=f"PesaPal responded with {response.status_code}")

# ==================== SUBSCRIPTION ROUTES ====================

@api_router.get("/subscription/plans")
async def get_plans():
    return {
        "plans": [
            {"id": "basic", "name": "Basic Plan", "price": 9999, "currency": "TZS", "period": "month",
             "features": ["50 lesson plans per month", "Create Notes", "Resource sharing", "My Activities"]},
            {"id": "premium", "name": "Premium Plan", "price": 19999, "currency": "TZS", "period": "month",
             "features": ["Unlimited lesson plans", "All Basic features", "Templates & Dictation", "Upload Materials & Scheme of Work", "Advanced analytics"]},
            {"id": "master", "name": "Master Plan", "price": 29999, "currency": "TZS", "period": "month",
             "features": ["Everything in Premium", "Refer & Earn access", "Dedicated support"]}
        ]
    }

@api_router.post("/subscription/checkout")
async def subscription_checkout(request: Request, user: User = Depends(get_current_user)):
    data = await request.json()
    plan_id = data.get("plan_id")
    plan_prices = {"basic": 9999, "premium": 19999, "master": 29999}
    if plan_id not in plan_prices:
        raise HTTPException(status_code=400, detail="Invalid plan selected")
    amount = plan_prices[plan_id]
    merchant_reference = f"{user.user_id}_{plan_id}_{uuid.uuid4().hex[:12]}"
    description = f"MiLessonPlan {plan_id.title()} subscription for {user.email}"
    transaction_doc = {
        "merchant_reference": merchant_reference, "user_id": user.user_id, "email": user.email,
        "plan_id": plan_id, "amount": amount, "currency": "TZS", "status": "pending",
        "pesapal_tracking_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.pesapal_transactions.insert_one(transaction_doc)
    checkout_url = await _create_pesapal_checkout_url(merchant_reference, amount, description, user)
    return {"message": "PesaPal checkout created", "checkout_url": checkout_url, "merchant_reference": merchant_reference}

@api_router.post("/pesapal/ipn")
async def pesapal_ipn(request: Request):
    form = await request.form()
    transaction_tracking_id = form.get("pesapal_transaction_tracking_id")
    merchant_reference = form.get("pesapal_merchant_reference")
    transaction_status = form.get("pesapal_transaction_status")
    if not merchant_reference:
        raise HTTPException(status_code=400, detail="Missing merchant reference")
    tx = await db.pesapal_transactions.find_one({"merchant_reference": merchant_reference}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    ipn_trace = {"timestamp": datetime.now(timezone.utc).isoformat(), "tracking_id": transaction_tracking_id, "status": transaction_status}
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if transaction_tracking_id:
        update_data["pesapal_tracking_id"] = transaction_tracking_id
    if transaction_status:
        update_data["status"] = transaction_status.upper()
    await db.pesapal_transactions.update_one(
        {"merchant_reference": merchant_reference},
        {"$set": update_data, "$push": {"ipn_traces": ipn_trace}}
    )
    if transaction_status and transaction_status.upper() in ["COMPLETED", "VALID"]:
        expires = datetime.now(timezone.utc) + timedelta(days=30)
        await db.users.update_one(
            {"user_id": tx["user_id"]},
            {"$set": {"subscription_status": "active", "subscription_plan": tx["plan_id"], "subscription_expires": expires.isoformat()}}
        )
        # Credit referrer 30% commission
        user_doc = await db.users.find_one({"user_id": tx["user_id"]}, {"_id": 0})
        referred_by = user_doc.get("referred_by") if user_doc else None
        if referred_by:
            plan_prices = {"basic": 9999, "premium": 19999, "master": 29999}
            price = plan_prices.get(tx["plan_id"], 0)
            if price > 0:
                await db.referral_commissions.insert_one({
                    "commission_id": f"comm_{uuid.uuid4().hex[:12]}",
                    "referrer_id": referred_by,
                    "referee_id": tx["user_id"],
                    "plan": tx["plan_id"],
                    "plan_price": price,
                    "commission_amount": round(price * 0.3),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
        # Legacy referral update
        referral = await db.referrals.find_one({"teacher_id": tx["user_id"]}, {"_id": 0})
        if referral:
            await update_referral_commission(referral["referral_id"], tx["plan_id"], 1)
    return JSONResponse({"message": "PesaPal IPN processed successfully"})

@api_router.post("/subscription/subscribe")
async def subscribe(request: Request, user: User = Depends(get_current_user)):
    """Fallback local plan activation"""
    data = await request.json()
    plan_id = data.get("plan_id")
    if plan_id not in ["basic", "premium", "master", "monthly", "yearly"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    if plan_id in ["yearly"]:
        expires = datetime.now(timezone.utc) + timedelta(days=365)
    else:
        expires = datetime.now(timezone.utc) + timedelta(days=30)
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"subscription_status": "active", "subscription_plan": plan_id, "subscription_expires": expires.isoformat()}}
    )
    # Credit referrer 30% commission
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    referred_by = user_doc.get("referred_by") if user_doc else None
    if referred_by:
        plan_prices = {"basic": 9999, "premium": 19999, "master": 29999}
        price = plan_prices.get(plan_id, 0)
        if price > 0:
            commission = round(price * 0.3)
            await db.referral_commissions.insert_one({
                "commission_id": f"comm_{uuid.uuid4().hex[:12]}",
                "referrer_id": referred_by,
                "referee_id": user.user_id,
                "plan": plan_id,
                "plan_price": price,
                "commission_amount": commission,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
    # Legacy referral update
    referral = await db.referrals.find_one({"teacher_id": user.user_id}, {"_id": 0})
    if referral:
        await update_referral_commission(referral["referral_id"], plan_id, 1)
    return {"message": "Subscription activated", "expires": expires.isoformat()}

# ==================== REFERRAL ROUTES ====================

@api_router.post("/referrals")
async def create_referral(request: Request, user: User = Depends(get_current_user)):
    data = await request.json()
    for field in ["teacher_id", "teacher_name", "teacher_email", "admin_id", "admin_name"]:
        if field not in data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    existing = await db.referrals.find_one({"teacher_id": data["teacher_id"], "admin_id": data["admin_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Referral already exists")
    referral = Referral(
        teacher_id=data["teacher_id"], teacher_name=data["teacher_name"], teacher_email=data["teacher_email"],
        admin_id=data["admin_id"], admin_name=data["admin_name"],
        subscription_plan=data.get("subscription_plan", "free"), monthly_price=data.get("monthly_price", 0)
    )
    await db.referrals.insert_one(referral.model_dump())
    return {"message": "Referral created", "referral": referral.model_dump()}

@api_router.get("/referrals/admin/{admin_id}")
async def get_admin_referrals(admin_id: str, user: User = Depends(get_current_user)):
    referrals = await db.referrals.find({"admin_id": admin_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    metrics = await get_referral_metrics(admin_id)
    return {"referrals": referrals, "metrics": metrics.model_dump()}

@api_router.put("/referrals/{referral_id}")
async def update_referral(referral_id: str, request: Request, user: User = Depends(get_current_user)):
    data = await request.json()
    existing = await db.referrals.find_one({"referral_id": referral_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Referral not found")
    update_data = {"updated_at": datetime.now(timezone.utc)}
    for field in ["subscription_plan", "monthly_price", "active_months", "inactive_months", "status"]:
        if field in data:
            update_data[field] = data[field]
    if "subscription_plan" in data or "active_months" in data:
        plan = data.get("subscription_plan", existing.get("subscription_plan", "free"))
        months = data.get("active_months", existing.get("active_months", 0))
        update_data["total_commission"] = await calculate_commission(plan, months)
    await db.referrals.update_one({"referral_id": referral_id}, {"$set": update_data})
    updated = await db.referrals.find_one({"referral_id": referral_id}, {"_id": 0})
    return {"message": "Referral updated", "referral": updated}

@api_router.delete("/referrals/{referral_id}")
async def delete_referral(referral_id: str, user: User = Depends(get_current_user)):
    existing = await db.referrals.find_one({"referral_id": referral_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Referral not found")
    await db.referrals.delete_one({"referral_id": referral_id})
    return {"message": "Referral deleted"}

@api_router.get("/referrals/metrics/{admin_id}")
async def get_referral_metrics_endpoint(admin_id: str, user: User = Depends(get_current_user)):
    metrics = await get_referral_metrics(admin_id)
    return metrics.model_dump()

@api_router.post("/referrals/sync/{admin_id}")
async def sync_admin_referrals_endpoint(admin_id: str, user: User = Depends(get_current_user)):
    await sync_admin_referrals(admin_id)
    return {"message": "Referrals synced successfully"}

# ==================== TEACHER REFERRAL ROUTES ====================

@api_router.get("/teacher/referral/my-code")
async def get_my_referral_code(user: User = Depends(get_current_user)):
    """Get or generate the teacher's unique referral code"""
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    code = user_doc.get("referral_code") if user_doc else None
    if not code:
        code = f"ML{uuid.uuid4().hex[:6].upper()}"
        await db.users.update_one({"user_id": user.user_id}, {"$set": {"referral_code": code}})
    base_url = "https://mi-learning-hub.preview.emergentagent.com"
    return {
        "referral_code": code,
        "referral_link": f"{base_url}/login?ref={code}",
    }

@api_router.get("/teacher/referral/my-referrals")
async def get_my_referrals(user: User = Depends(get_current_user)):
    """Get list of users referred by this teacher"""
    referred_users = await db.users.find(
        {"referred_by": user.user_id},
        {"_id": 0, "user_id": 1, "name": 1, "email": 1, "subscription_plan": 1, "subscription_status": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(500)

    # Calculate earnings
    plan_prices = {"free": 0, "basic": 9999, "premium": 19999, "master": 29999, "enterprise": 29999}
    total_earned = 0
    pending = 0
    referrals_with_earnings = []
    for u in referred_users:
        plan = u.get("subscription_plan", "free")
        price = plan_prices.get(plan, 0)
        commission = round(price * 0.3)
        # Check commission payouts
        paid_amount = 0
        payouts = await db.referral_payouts.find({"referrer_id": user.user_id, "referee_id": u["user_id"]}, {"_id": 0}).to_list(100)
        paid_amount = sum(p.get("amount", 0) for p in payouts)
        unpaid = commission - paid_amount if commission > 0 else 0
        total_earned += commission
        pending += max(0, unpaid)
        referrals_with_earnings.append({
            "user_id": u["user_id"],
            "name": u.get("name", "Unknown"),
            "email": u.get("email", ""),
            "plan": plan,
            "commission_per_cycle": commission,
            "total_paid": paid_amount,
            "joined": u.get("created_at"),
        })

    return {
        "referrals": referrals_with_earnings,
        "total_referrals": len(referred_users),
        "total_earned": total_earned,
        "pending_payout": pending,
    }

# ==================== ADMIN REFERRAL MANAGEMENT ====================

@api_router.get("/admin/teacher-referrals")
async def admin_get_teacher_referrals(current_admin: Admin = Depends(get_current_admin)):
    """Admin: Get all referrers with their referees and earnings"""
    # Find all users who have referred someone
    referrers_pipeline = [
        {"$match": {"referred_by": {"$ne": None}}},
        {"$group": {"_id": "$referred_by", "referee_count": {"$sum": 1}}},
    ]
    referrer_groups = await db.users.aggregate(referrers_pipeline).to_list(1000)

    plan_prices = {"free": 0, "basic": 9999, "premium": 19999, "master": 29999, "enterprise": 29999}
    results = []
    for group in referrer_groups:
        referrer_id = group["_id"]
        referrer_doc = await db.users.find_one({"user_id": referrer_id}, {"_id": 0, "user_id": 1, "name": 1, "email": 1, "referral_code": 1})
        if not referrer_doc:
            continue
        # Get referees
        referees = await db.users.find(
            {"referred_by": referrer_id},
            {"_id": 0, "user_id": 1, "name": 1, "email": 1, "subscription_plan": 1, "created_at": 1}
        ).to_list(500)
        total_commission = sum(round(plan_prices.get(r.get("subscription_plan", "free"), 0) * 0.3) for r in referees)
        total_paid = 0
        payouts = await db.referral_payouts.find({"referrer_id": referrer_id}, {"_id": 0}).to_list(500)
        total_paid = sum(p.get("amount", 0) for p in payouts)
        results.append({
            "referrer": referrer_doc,
            "referees": referees,
            "total_commission": total_commission,
            "total_paid": total_paid,
            "pending": max(0, total_commission - total_paid),
            "referee_count": group["referee_count"],
        })

    # Get payout settings
    settings = await db.referral_settings.find_one({"key": "payout_schedule"}, {"_id": 0})
    payout_schedule = settings.get("value", "monthly") if settings else "monthly"

    return {"referrers": results, "payout_schedule": payout_schedule}

@api_router.put("/admin/referral-settings/payout-schedule")
async def admin_set_payout_schedule(request: Request, current_admin: Admin = Depends(get_current_admin)):
    """Admin: Set payout duration (biweekly or monthly)"""
    data = await request.json()
    schedule = data.get("schedule", "monthly")
    if schedule not in ["biweekly", "monthly"]:
        raise HTTPException(status_code=400, detail="Schedule must be 'biweekly' or 'monthly'")
    await db.referral_settings.update_one(
        {"key": "payout_schedule"},
        {"$set": {"key": "payout_schedule", "value": schedule, "updated_at": datetime.now(timezone.utc).isoformat(), "updated_by": current_admin.admin_id}},
        upsert=True
    )
    return {"message": f"Payout schedule set to {schedule}", "schedule": schedule}

@api_router.post("/admin/referral-payouts")
async def admin_create_payout(request: Request, current_admin: Admin = Depends(get_current_admin)):
    """Admin: Record a payout to a referrer"""
    data = await request.json()
    referrer_id = data.get("referrer_id")
    amount = data.get("amount", 0)
    if not referrer_id or amount <= 0:
        raise HTTPException(status_code=400, detail="referrer_id and positive amount required")
    payout = {
        "payout_id": f"pay_{uuid.uuid4().hex[:12]}",
        "referrer_id": referrer_id,
        "referee_id": data.get("referee_id"),
        "amount": amount,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_admin.admin_id,
    }
    await db.referral_payouts.insert_one(payout)
    payout.pop("_id", None)
    return {"message": "Payout recorded", "payout": payout}

@api_router.get("/admin/referral-payouts")
async def admin_get_payouts(current_admin: Admin = Depends(get_current_admin)):
    """Admin: Get all payouts"""
    payouts = await db.referral_payouts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"payouts": payouts}

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


# ==================== TEMPLATE ROUTES ====================

DEFAULT_TEMPLATES = [
    {"template_id": "template_basic", "name": "Basic Template", "type": "basic", "description": "Simple note format with title, subject, and content.", "required_subscription": "basic", "content": {"title": "Lesson Plan", "subject": "General", "category": "Lesson", "body": ""}, "is_active": True, "is_default": True},
    {"template_id": "template_scientific", "name": "Scientific Template", "type": "scientific", "description": "Split layout with image uploads on left and notes on right.", "required_subscription": "basic", "content": {"title": "Scientific Notes", "subject": "Science", "category": "Experiment", "body": ""}, "is_active": True, "is_default": True},
    {"template_id": "template_geography", "name": "Geography Template", "type": "geography", "description": "Image upload for physical geography/maps with question areas.", "required_subscription": "premium", "content": {"title": "Geography Lesson", "subject": "Geography", "category": "Map Reading", "body": "", "questions": []}, "is_active": True, "is_default": True},
    {"template_id": "template_mathematics", "name": "Mathematics Template", "type": "mathematics", "description": "Text area for math problems and solutions.", "required_subscription": "premium", "content": {"title": "Mathematics Lesson", "subject": "Mathematics", "category": "Algebra", "body": ""}, "is_active": True, "is_default": True},
    {"template_id": "template_physics", "name": "Physics Template", "type": "physics", "description": "Text area for physics problems and solutions.", "required_subscription": "premium", "content": {"title": "Physics Lesson", "subject": "Physics", "category": "Mechanics", "body": ""}, "is_active": True, "is_default": True},
    {"template_id": "template_chemistry", "name": "Chemistry Template", "type": "chemistry", "description": "Text area for chemistry problems and solutions.", "required_subscription": "premium", "content": {"title": "Chemistry Lesson", "subject": "Chemistry", "category": "Organic", "body": ""}, "is_active": True, "is_default": True},
]

@api_router.get("/templates")
async def get_templates(user: User = Depends(get_current_user)):
    """Get all templates for current user (user-saved + defaults)"""
    user_templates = await db.templates.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    saved_ids = {t["template_id"] for t in user_templates}
    # Merge defaults for any not overridden
    result = list(user_templates)
    for dt in DEFAULT_TEMPLATES:
        if dt["template_id"] not in saved_ids:
            result.append(dt)
    return {"templates": result}

@api_router.post("/templates")
async def save_template(request: Request, user: User = Depends(get_current_user)):
    """Save or update a user template"""
    data = await request.json()
    template_id = data.get("template_id", f"template_{uuid.uuid4().hex[:12]}")
    
    template = {
        "template_id": template_id,
        "user_id": user.user_id,
        "name": data.get("name", ""),
        "type": data.get("type", "basic"),
        "description": data.get("description", ""),
        "content": data.get("content", {}),
        "is_active": data.get("is_active", True),
        "is_default": False,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_at": data.get("created_at", datetime.now(timezone.utc).isoformat()),
    }
    
    await db.templates.update_one(
        {"template_id": template_id, "user_id": user.user_id},
        {"$set": template},
        upsert=True
    )
    template.pop("_id", None)
    return template

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str, user: User = Depends(get_current_user)):
    await db.templates.delete_one({"template_id": template_id, "user_id": user.user_id})
    return {"message": "Template deleted"}

def _build_images_html(images: list, image_registry: list = None) -> str:
    """Build HTML img tags. If image_registry is provided, stores image data for MHTML packaging."""
    if not images:
        return ""
    html = ""
    for i, img in enumerate(images):
        if not img:
            continue
        data_url = img.get("dataUrl", "") if isinstance(img, dict) else ""
        name = img.get("name", f"Image_{i+1}") if isinstance(img, dict) else f"Image_{i+1}"
        if data_url and "base64," in data_url:
            img_ref = f"image_{i:03d}_{name.replace(' ','_')}"
            if image_registry is not None:
                image_registry.append({"ref": img_ref, "dataUrl": data_url, "name": name})
            html += f'<div class="img-container"><img src="{img_ref}" width="480" alt="{name}" /><p class="img-caption">{name}</p></div>'
    return html


def _build_mhtml(html_content: str, images: list, filename: str) -> bytes:
    """Package HTML + images into MHTML format that Microsoft Word can open with embedded images."""
    import base64
    boundary = "----=_NextPart_MiLesson"

    parts = []
    # HTML part
    parts.append(f"""Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: quoted-printable
Content-Location: {filename}

{html_content}""")

    # Image parts
    for img_info in images:
        data_url = img_info["dataUrl"]
        ref = img_info["ref"]
        # Parse data URL: data:image/png;base64,AAAA...
        header_part, b64_data = data_url.split("base64,", 1)
        mime_type = header_part.replace("data:", "").rstrip(";")
        if not mime_type:
            mime_type = "image/png"
        # Wrap base64 at 76 chars for MIME compliance
        wrapped = "\n".join(b64_data[j:j+76] for j in range(0, len(b64_data), 76))
        parts.append(f"""Content-Type: {mime_type}
Content-Transfer-Encoding: base64
Content-Location: {ref}

{wrapped}""")

    mhtml = f"""MIME-Version: 1.0
Content-Type: multipart/related; boundary="{boundary}"

""" + "\n".join(f"--{boundary}\n{part}" for part in parts) + f"\n--{boundary}--"

    return mhtml.encode("utf-8")

@api_router.post("/templates/{template_id}/export")
async def export_template(template_id: str, request: Request, user: User = Depends(get_current_user)):
    """Export a template as Word-compatible MHTML document with embedded images"""
    from fastapi.responses import Response as FastAPIResponse
    
    data = await request.json()
    content = data.get("content", {})
    template_type = data.get("type", "basic")
    user_name = user.name or ""
    current_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    title = content.get("title", "Document")
    subject = content.get("subject", "General")
    category = content.get("category", "General")
    body = content.get("body", "")
    images = content.get("images", [])
    
    meta = f'<strong>Subject:</strong> {subject} | <strong>Category:</strong> {category} | <strong>Created:</strong> {current_date}'
    if user_name:
        meta += f' | <strong>Teacher:</strong> {user_name}'
    
    styles = """body{font-family:'Segoe UI',Tahoma,sans-serif;margin:30px;line-height:1.6;color:#374151}
    h1{color:#1f2937;border-bottom:2px solid #e5e7eb;padding-bottom:10px;margin-bottom:20px}
    h2{color:#2D5A27;margin:20px 0 10px;font-size:14pt}
    h3{color:#2D5A27;margin:18px 0 8px}
    .meta{color:#6b7280;font-size:14px;margin-bottom:20px}.content{line-height:1.8}
    .img-container{margin:16px 0;text-align:center;page-break-inside:avoid}
    .img-caption{color:#6b7280;font-size:10px;margin-top:6px;text-align:center;font-style:italic}
    .question-block{margin:10px 0;padding:12px 16px;background:#f8fafc;border-left:3px solid #4B0082;font-size:11pt}"""
    
    image_registry = []
    images_html = _build_images_html(images, image_registry)
    
    if template_type == "scientific":
        body_html = f"""<div style="display:table;width:100%">
            <div style="display:table-cell;width:35%;vertical-align:top;padding:15px;background:#f8fafc;border:1px solid #e2e8f0">
                <h3 style="margin-top:0">Diagrams &amp; Photos</h3>
                {images_html or '<p style="color:#9ca3af;font-size:12px">No images uploaded</p>'}
            </div>
            <div style="display:table-cell;width:65%;vertical-align:top;padding-left:20px">
                <h1>{title}</h1><div class="meta">{meta}</div><div class="content">{body}</div>
            </div></div>"""
    elif template_type == "geography":
        questions = content.get("questions", [])
        q_html = "".join(f'<div class="question-block"><strong>Q{i+1}:</strong> {q}</div>' for i, q in enumerate(questions) if q)
        body_html = f"""<h1>{title}</h1><div class="meta">{meta}</div>
            <h2>Geography Images / Maps</h2>
            {images_html or '<p style="color:#9ca3af;font-size:12px">No images uploaded</p>'}
            <h2>Questions</h2>{q_html or '<p style="color:#9ca3af">No questions added</p>'}"""
    elif template_type in ("mathematics", "physics", "chemistry"):
        styles += " .content{white-space:pre-wrap;font-family:'Courier New',monospace}"
        body_html = f'<h1>{title}</h1><div class="meta">{meta}</div><div class="content">{body}</div>'
    else:
        body_html = f'<h1>{title}</h1><div class="meta">{meta}</div><div class="content">{body}</div>'
        if images_html:
            body_html += f'<h2>Attachments</h2>{images_html}'
    
    word_ns = 'xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"'
    html = f"""<html {word_ns}>
    <head><meta charset="utf-8"><style>{styles}</style></head>
    <body>{body_html}</body></html>"""
    
    filename = f"{title.replace(' ','_')}_{template_type}.doc"
    
    if image_registry:
        content_bytes = _build_mhtml(html, image_registry, filename)
    else:
        content_bytes = f'\ufeff{html}'.encode('utf-8')
    
    return FastAPIResponse(
        content=content_bytes,
        media_type="application/msword",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


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
    
    text += "\nGenerated by MiLesson Plan\n"
    
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

# ==================== SHARED LINKS ROUTES ====================

import secrets
import string

def generate_link_code(length=8):
    """Generate a short random alphanumeric code for shared links"""
    alphabet = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

async def resolve_resource(resource_type: str, resource_id: str, teacher_id: str):
    """Fetch a resource by type and ID for the teacher. Returns dict or None."""
    if resource_type == "lesson":
        return await db.lesson_plans.find_one({"lesson_id": resource_id, "user_id": teacher_id}, {"_id": 0})
    elif resource_type == "note":
        return await db.notes.find_one({"note_id": resource_id, "user_id": teacher_id}, {"_id": 0})
    elif resource_type == "scheme":
        return await db.schemes.find_one({"scheme_id": resource_id, "user_id": teacher_id}, {"_id": 0})
    elif resource_type == "template":
        return await db.templates.find_one({"template_id": resource_id, "user_id": teacher_id}, {"_id": 0})
    elif resource_type == "dictation":
        return await db.dictations.find_one({"dictation_id": resource_id, "user_id": teacher_id}, {"_id": 0})
    return None

def build_resource_preview(resource_type: str, resource: dict) -> dict:
    """Build a safe preview object from a resource (no full content for paid links)."""
    if resource_type == "lesson":
        return {"subject": resource.get("subject", ""), "grade": resource.get("grade", ""), "topic": resource.get("topic", ""), "syllabus": resource.get("syllabus", "")}
    elif resource_type == "note":
        import re
        content = resource.get("content", "")
        plain = re.sub(r'<[^>]+>', '', content) if content else ""
        return {"title": resource.get("title", ""), "preview": plain[:200] if plain else ""}
    elif resource_type == "scheme":
        return {"subject": resource.get("subject", ""), "syllabus": resource.get("syllabus", ""), "school": resource.get("school", ""), "term": resource.get("term", ""), "competency_count": len(resource.get("competencies", []))}
    elif resource_type == "template":
        return {"name": resource.get("name", ""), "type": resource.get("type", ""), "description": resource.get("description", "")}
    elif resource_type == "dictation":
        return {"title": resource.get("title", ""), "language": resource.get("language", ""), "text_preview": (resource.get("text", ""))[:150]}
    return {}

def build_download_content(resource_type: str, resource: dict) -> tuple:
    """Build downloadable Word document. Returns (content_bytes, media_type, filename)."""
    doc_styles = """
      body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; margin: 30px; line-height: 1.7; color: #1f2937; background: #fff; }
      h1 { font-size: 22pt; color: #1a2e16; text-align: center; border-bottom: 3px solid #2D5A27; padding-bottom: 12px; margin-bottom: 8px; }
      h2 { font-size: 14pt; color: #2D5A27; margin: 20px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
      h3 { font-size: 12pt; color: #4a5b46; margin: 14px 0 6px; }
      .subtitle { text-align: center; color: #6b7280; font-size: 11pt; margin-bottom: 20px; }
      .meta-table { width: 100%; border-collapse: collapse; margin: 15px 0 25px; }
      .meta-table td { padding: 6px 12px; border: 1px solid #d1d5db; font-size: 10pt; }
      .meta-table td:first-child { font-weight: bold; background: #f8f6f1; width: 140px; color: #2D5A27; }
      .section { margin: 16px 0; padding: 14px 18px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fafaf8; }
      .section-title { font-weight: bold; font-size: 11pt; color: #2D5A27; margin-bottom: 8px; border-bottom: 1px dashed #d1d5db; padding-bottom: 4px; }
      .section p { margin: 4px 0; font-size: 10pt; }
      .content { line-height: 1.8; font-size: 11pt; }
      .footer { text-align: center; margin-top: 30px; padding-top: 12px; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 9pt; }
      table.data { width: 100%; border-collapse: collapse; margin: 10px 0; }
      table.data th { background: #2D5A27; color: #fff; padding: 8px 6px; border: 1px solid #1a2e16; font-size: 9pt; text-align: center; }
      table.data td { border: 1px solid #999; padding: 6px; vertical-align: top; font-size: 9pt; }
    """
    word_ns = 'xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"'

    if resource_type == "lesson":
        content = resource.get("content", {})
        syllabus = resource.get("syllabus", "")
        subject = resource.get("subject", "")
        grade = resource.get("grade", "")
        topic = resource.get("topic", "")
        created = resource.get("created_at", "")

        sections_html = ""
        for key, val in content.items():
            if isinstance(val, str):
                label = key.replace('_', ' ').title()
                sections_html += f'<div class="section"><div class="section-title">{label}</div><p>{val}</p></div>'
            elif isinstance(val, dict):
                label = key.replace('_', ' ').title()
                inner = "".join(f'<p><strong>{k}:</strong> {v}</p>' for k, v in val.items())
                time_str = val.get("time", "")
                title_extra = f" ({time_str})" if time_str else ""
                sections_html += f'<div class="section"><div class="section-title">{label}{title_extra}</div>{inner}</div>'

        html = f"""<html {word_ns}>
        <head><meta charset="utf-8"><style>{doc_styles}</style></head><body>
        <h1>{syllabus.upper()} LESSON PLAN</h1>
        <table class="meta-table">
          <tr><td>Subject</td><td>{subject}</td></tr>
          <tr><td>Grade / Class</td><td>{grade}</td></tr>
          <tr><td>Topic</td><td>{topic}</td></tr>
          <tr><td>Syllabus</td><td>{syllabus}</td></tr>
          <tr><td>Date</td><td>{created[:10] if created else ''}</td></tr>
        </table>
        {sections_html}
        <div class="footer">Generated &amp; Shared via MiLesson Plan</div>
        </body></html>"""
        filename = f"{subject}_{topic}_Lesson_Plan.doc".replace(' ', '_')
        return f'\ufeff{html}'.encode('utf-8'), "application/msword", filename

    elif resource_type == "note":
        title = resource.get("title", "Note")
        note_content = resource.get("content", "")
        created = resource.get("created_at", "")
        html = f"""<html {word_ns}>
        <head><meta charset="utf-8"><style>{doc_styles}</style></head><body>
        <h1>{title}</h1>
        <p class="subtitle">Created: {created[:10] if created else ''}</p>
        <div class="content">{note_content}</div>
        <div class="footer">Shared via MiLesson Plan</div>
        </body></html>"""
        filename = f"{title.replace(' ','_')}.doc"
        return f'\ufeff{html}'.encode('utf-8'), "application/msword", filename

    elif resource_type == "scheme":
        cols = ["Main Competence", "Specific Competences", "Learning Activities", "Specific Activities",
                "Month", "Week", "Periods", "Methods", "Resources", "Assessment", "References", "Remarks"]
        col_keys = ["main", "specific", "activities", "specificActivities", "month", "week", "periods",
                    "methods", "resources", "assessment", "references", "remarks"]
        rows_html = ""
        for row in resource.get("competencies", []):
            cells = "".join(f'<td>{row.get(k, "")}</td>' for k in col_keys)
            rows_html += f"<tr>{cells}</tr>"
        html = f"""<html {word_ns}>
        <head><meta charset="utf-8"><style>{doc_styles}
        @page {{ size: landscape; margin: 10mm; }}</style></head><body>
        <h1>SCHEME OF WORK</h1>
        <p class="subtitle">{resource.get('syllabus','').upper()}</p>
        <table class="meta-table">
          <tr><td>School</td><td>{resource.get('school','')}</td></tr>
          <tr><td>Teacher</td><td>{resource.get('teacher','')}</td></tr>
          <tr><td>Subject</td><td>{resource.get('subject','')}</td></tr>
          <tr><td>Year / Term / Class</td><td>{resource.get('year','')} &mdash; Term {resource.get('term','')} &mdash; Class {resource.get('class_name','')}</td></tr>
        </table>
        <table class="data">
          <thead><tr>{"".join(f'<th>{c}</th>' for c in cols)}</tr></thead>
          <tbody>{rows_html}</tbody>
        </table>
        <div class="footer">Shared via MiLesson Plan</div>
        </body></html>"""
        filename = f"Scheme_{resource.get('subject','untitled')}_{resource.get('syllabus','')}.doc"
        return f'\ufeff{html}'.encode('utf-8'), "application/msword", filename

    elif resource_type == "template":
        content = resource.get("content", {})
        body = content.get("body", "")
        title = content.get("title", resource.get("name", "Template"))
        subject = content.get("subject", "")
        category = content.get("category", "")
        tpl_type = resource.get("type", "basic")
        images = content.get("images", [])

        extra_style = ""
        if tpl_type in ("mathematics", "physics", "chemistry"):
            extra_style = " .content { white-space: pre-wrap; font-family: 'Courier New', monospace; }"

        extra_style += """
        .img-container{margin:16px 0;text-align:center;page-break-inside:avoid}
        .img-caption{color:#6b7280;font-size:9pt;margin-top:6px;text-align:center;font-style:italic}
        """

        meta_line = f'<strong>Subject:</strong> {subject}'
        if category:
            meta_line += f' | <strong>Category:</strong> {category}'
        meta_line += f' | <strong>Type:</strong> {tpl_type.title()}'

        image_registry = []
        images_html = _build_images_html(images, image_registry)

        if tpl_type == "scientific":
            body_html = f"""<div style="display:table;width:100%">
                <div style="display:table-cell;width:35%;vertical-align:top;padding:15px;background:#f8fafc;border:1px solid #e2e8f0">
                    <h2 style="margin-top:0;font-size:12pt">Diagrams &amp; Photos</h2>
                    {images_html or '<p style="color:#9ca3af;font-size:10pt">No images uploaded</p>'}
                </div>
                <div style="display:table-cell;width:65%;vertical-align:top;padding-left:20px">
                    <div class="content">{body}</div>
                </div></div>"""
        elif tpl_type == "geography":
            questions = content.get("questions", [])
            q_html = ""
            if questions:
                q_html = '<h2>Questions</h2>'
                for i, q in enumerate(questions):
                    if q:
                        q_html += f'<div class="section" style="border-left:3px solid #7C3AED"><p><strong>Q{i+1}:</strong> {q}</p></div>'

            body_html = f"""<h2>Geography Images / Maps</h2>
                {images_html or '<p style="color:#9ca3af;font-size:10pt">No images uploaded</p>'}
                {q_html}"""
        else:
            body_html = f'<div class="content">{body}</div>'
            if images_html:
                body_html += f'<h2>Attachments</h2>{images_html}'

        html = f"""<html {word_ns}>
        <head><meta charset="utf-8"><style>{doc_styles}{extra_style}</style></head><body>
        <h1>{title}</h1>
        <p class="subtitle">{meta_line}</p>
        {body_html}
        <div class="footer">Shared via MiLesson Plan</div>
        </body></html>"""
        filename = f"{title.replace(' ','_')}_{tpl_type}.doc"

        if image_registry:
            return _build_mhtml(html, image_registry, filename), "application/msword", filename
        return f'\ufeff{html}'.encode('utf-8'), "application/msword", filename

    elif resource_type == "dictation":
        title = resource.get("title", "Dictation")
        lang_names = {"en-GB": "English", "sw": "Swahili", "ar": "Arabic", "tr": "Turkish", "fr": "French"}
        language = lang_names.get(resource.get("language", ""), resource.get("language", ""))
        text = resource.get("text", "")
        html = f"""<html {word_ns}>
        <head><meta charset="utf-8"><style>{doc_styles}</style></head><body>
        <h1>{title}</h1>
        <p class="subtitle">Dictation &mdash; {language}</p>
        <div class="content" style="font-size:14pt; line-height:2.2; padding:20px; border:1px solid #e2e8f0; border-radius:8px; background:#fafaf8;">
        {text}
        </div>
        <div class="footer">Shared via MiLesson Plan</div>
        </body></html>"""
        filename = f"Dictation_{title.replace(' ','_')}.doc"
        return f'\ufeff{html}'.encode('utf-8'), "application/msword", filename

    return b"", "application/octet-stream", "download"

@api_router.post("/links")
async def create_shared_link(request: Request, user: User = Depends(get_current_user)):
    """Create a shareable link for a resource"""
    data = await request.json()
    resource_type = data.get("resource_type")
    resource_id = data.get("resource_id")
    is_paid = data.get("is_paid", False)
    price = data.get("price", 0) if is_paid else 0
    description = data.get("description", "")

    if resource_type not in ("lesson", "note", "scheme", "template", "dictation"):
        raise HTTPException(status_code=400, detail="Invalid resource_type")
    if not resource_id:
        raise HTTPException(status_code=400, detail="resource_id required")

    resource = await resolve_resource(resource_type, resource_id, user.user_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Derive title
    title = (resource.get("topic") or resource.get("title") or resource.get("name")
             or resource.get("subject") or "Shared Resource")

    # Generate unique code
    link_code = generate_link_code()
    while await db.shared_links.find_one({"link_code": link_code}):
        link_code = generate_link_code()

    link_doc = {
        "link_code": link_code,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "teacher_id": user.user_id,
        "teacher_name": user.name or "Teacher",
        "title": title,
        "description": description,
        "is_paid": is_paid,
        "price": price,
        "status": "active",
        "download_count": 0,
        "max_downloads": 1,
        "ratings": [],
        "avg_rating": 0,
        "total_ratings": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.shared_links.insert_one(link_doc)
    link_doc.pop("_id", None)
    return link_doc

@api_router.get("/links/{code}")
async def get_shared_link(code: str):
    """Public: Get shared link metadata + preview (no auth required)"""
    link = await db.shared_links.find_one({"link_code": code}, {"_id": 0})
    if not link:
        raise HTTPException(status_code=404, detail="Shared link not found")

    if link["status"] != "active":
        return {"link": link, "preview": None, "expired": True}

    resource = await resolve_resource(link["resource_type"], link["resource_id"], link["teacher_id"])
    preview = build_resource_preview(link["resource_type"], resource) if resource else {}

    return {"link": link, "preview": preview, "expired": False}

@api_router.get("/links/{code}/download")
async def download_shared_link(code: str):
    """Public: Download the shared resource content. Auto-expires after 1 download."""
    from fastapi.responses import Response as FastAPIResponse

    link = await db.shared_links.find_one({"link_code": code}, {"_id": 0})
    if not link:
        raise HTTPException(status_code=404, detail="Shared link not found")

    if link["status"] != "active":
        raise HTTPException(status_code=410, detail="This link has expired")

    if link["download_count"] >= link["max_downloads"]:
        await db.shared_links.update_one({"link_code": code}, {"$set": {"status": "expired", "updated_at": datetime.now(timezone.utc).isoformat()}})
        raise HTTPException(status_code=410, detail="This link has expired after maximum downloads")

    resource = await resolve_resource(link["resource_type"], link["resource_id"], link["teacher_id"])
    if not resource:
        raise HTTPException(status_code=404, detail="Resource no longer available")

    content_bytes, media_type, filename = build_download_content(link["resource_type"], resource)

    # Increment download count and auto-expire
    new_count = link["download_count"] + 1
    new_status = "expired" if new_count >= link["max_downloads"] else "active"
    await db.shared_links.update_one(
        {"link_code": code},
        {"$set": {"download_count": new_count, "status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    return FastAPIResponse(
        content=content_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@api_router.post("/links/{code}/rate")
async def rate_shared_link(code: str, request: Request):
    """Public: Rate a shared resource (no auth required)"""
    data = await request.json()
    score = data.get("score")
    comment = data.get("comment", "")

    if not score or score < 1 or score > 5:
        raise HTTPException(status_code=400, detail="Score must be between 1 and 5")

    link = await db.shared_links.find_one({"link_code": code}, {"_id": 0})
    if not link:
        raise HTTPException(status_code=404, detail="Shared link not found")

    rating = {"score": score, "comment": comment, "created_at": datetime.now(timezone.utc).isoformat()}
    ratings = link.get("ratings", [])
    ratings.append(rating)
    total = len(ratings)
    avg = sum(r["score"] for r in ratings) / total

    await db.shared_links.update_one(
        {"link_code": code},
        {"$set": {"ratings": ratings, "avg_rating": round(avg, 1), "total_ratings": total, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    return {"message": "Rating submitted", "avg_rating": round(avg, 1), "total_ratings": total}

@api_router.get("/my-links")
async def get_my_shared_links(user: User = Depends(get_current_user)):
    """Get all shared links created by the current teacher"""
    links = await db.shared_links.find(
        {"teacher_id": user.user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"links": links}

@api_router.delete("/links/{code}")
async def delete_shared_link(code: str, user: User = Depends(get_current_user)):
    """Disable/delete a shared link"""
    result = await db.shared_links.update_one(
        {"link_code": code, "teacher_id": user.user_id},
        {"$set": {"status": "disabled", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Link not found")
    return {"message": "Link disabled"}

# ==================== CRON ROUTES ====================

@api_router.post("/admin/cron/renew-subscriptions")
async def renew_subscriptions_cron(current_admin: Admin = Depends(get_current_admin)):
    """Admin endpoint to manually trigger subscription renewal"""
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admins can trigger subscription renewal")
    renewed_count = await process_subscription_renewals()
    return {"message": f"Subscription renewal completed. {renewed_count} subscriptions renewed."}

async def process_subscription_renewals():
    """Process monthly subscription renewals and update referral commissions"""
    today = datetime.now(timezone.utc).date()
    expired_subscriptions = await db.users.find(
        {"subscription_status": "active", "subscription_expires": {"$exists": True}}, {"_id": 0}
    ).to_list(1000)
    renewed_count = 0
    for user in expired_subscriptions:
        try:
            expires_str = user.get("subscription_expires")
            if not expires_str:
                continue
            if isinstance(expires_str, str):
                expires_date = datetime.fromisoformat(expires_str.replace('Z', '+00:00'))
            else:
                expires_date = expires_str
            if expires_date.tzinfo is None:
                expires_date = expires_date.replace(tzinfo=timezone.utc)
            if expires_date.date() <= today:
                plan_id = user.get("subscription_plan", "free")
                if plan_id == "free":
                    continue
                new_expiry = datetime.now(timezone.utc) + timedelta(days=30)
                await db.users.update_one(
                    {"user_id": user["user_id"]},
                    {"$set": {"subscription_expires": new_expiry.isoformat()}}
                )
                referral = await db.referrals.find_one({"teacher_id": user["user_id"]}, {"_id": 0})
                if referral:
                    await update_referral_commission(referral["referral_id"], plan_id, 1)
                renewed_count += 1
        except Exception as e:
            continue
    return renewed_count

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
