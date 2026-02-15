from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel as PydanticBaseModel
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import uuid
import json
import hmac
import hashlib

# Models
from models.user import User, UserCreate, UserLogin, UserRole, Token, StudentLogin, UserUpdate
from models.university import (
    University, UniversityCreate, UniversityUpdate, 
    RegistrationConfig, RegistrationConfigUpdate, RazorpayConfig
)
from models.lead import (
    Lead, LeadCreate, LeadUpdate, LeadStage, LeadSource,
    LeadAssignment, LeadNote, LeadFollowUp, LeadStageUpdate,
    LeadBulkReassign, TimelineEntry, TimelineEventType, Note, FollowUp
)
from models.application import (
    Application, ApplicationCreate, ApplicationStatus, ApplicationStep,
    ApplicationBasicInfo, ApplicationEducationalDetails, ApplicationCourseSelection, EducationalDetail
)
from models.payment import Payment, PaymentCreate, PaymentVerify, PaymentStatus, TransferStatus, Refund
from models.document import Document, DocumentConfig, DocumentUpload, DocumentStatus, DocumentVerification
from models.test import (
    Question, QuestionCreate, QuestionUpdate, QuestionBank,
    TestConfig, TestConfigCreate, TestAttempt, TestAnswer, TestSubmit, TestResult
)
from models.department import (
    Department, DepartmentCreate, DepartmentUpdate,
    Course, CourseCreate, CourseUpdate,
    Session, SessionCreate, SessionUpdate
)
from models.email_log import EmailLog, EmailType, EmailStatus
from models.query import StudentQuery, QueryCreate, QueryReply, QueryUpdate, QueryStatus, QueryMessage
from services.email_service import email_service


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'unify-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Razorpay Configuration
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')

# Brevo Configuration
BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '')

# Create the main app
app = FastAPI(title="UNIFY API", version="1.0.0")

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
superadmin_router = APIRouter(prefix="/superadmin", tags=["Super Admin"])
university_router = APIRouter(prefix="/university", tags=["University"])
lead_router = APIRouter(prefix="/leads", tags=["Leads"])
application_router = APIRouter(prefix="/applications", tags=["Applications"])
payment_router = APIRouter(prefix="/payments", tags=["Payments"])
test_router = APIRouter(prefix="/tests", tags=["Tests"])
student_router = APIRouter(prefix="/student", tags=["Student Portal"])
email_router = APIRouter(prefix="/emails", tags=["Emails"])
query_router = APIRouter(prefix="/queries", tags=["Student Queries"])

security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============== UTILITY FUNCTIONS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_token(user_data: dict) -> str:
    payload = {
        **user_data,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token_data = decode_token(credentials.credentials)
    return token_data


def require_roles(*roles: UserRole):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in [r.value for r in roles]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker


def serialize_doc(doc: dict) -> dict:
    """Remove MongoDB _id and convert datetime objects"""
    if doc is None:
        return None
    doc.pop('_id', None)
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    return doc


async def add_timeline_entry(
    lead_id: str,
    event_type: TimelineEventType,
    description: str,
    user_id: str = None,
    user_name: str = None,
    metadata: dict = None
):
    """Add an entry to lead timeline"""
    entry = TimelineEntry(
        event_type=event_type,
        description=description,
        created_by=user_id,
        created_by_name=user_name,
        metadata=metadata or {}
    )
    await db.leads.update_one(
        {"id": lead_id},
        {
            "$push": {"timeline": entry.model_dump()},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )


# ============== STARTUP ==============

@app.on_event("startup")
async def startup_event():
    """Initialize database with super admin if not exists"""
    # Create indexes
    await db.users.create_index("email", unique=True, sparse=True)
    await db.users.create_index([("university_id", 1), ("person_id", 1)], unique=True, sparse=True)
    await db.universities.create_index("code", unique=True)
    await db.leads.create_index([("university_id", 1), ("email", 1)])
    await db.leads.create_index([("university_id", 1), ("phone", 1)])
    await db.applications.create_index("application_number", unique=True)
    
    # Create super admin if not exists
    super_admin = await db.users.find_one({"email": "admin@unify.com"})
    if not super_admin:
        admin = User(
            email="admin@unify.com",
            name="Super Admin",
            role=UserRole.SUPER_ADMIN,
            password_hash=hash_password("9939350820@#!")
        )
        await db.users.insert_one(admin.model_dump())
        logger.info("Super Admin created: admin@unify.com")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ============== AUTH ROUTES ==============

@auth_router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    """
    Universal login endpoint.
    - Super Admin: uses email + password
    - University Staff: uses university_id + role + person_id + password
    - Students: use /auth/student/login
    """
    user = None
    
    if login_data.email and login_data.role == UserRole.SUPER_ADMIN:
        # Super Admin login
        user = await db.users.find_one({"email": login_data.email, "role": "super_admin"}, {"_id": 0})
    elif login_data.university_id and login_data.person_id and login_data.role:
        # University staff login
        user = await db.users.find_one({
            "university_id": login_data.university_id,
            "person_id": login_data.person_id,
            "role": login_data.role.value
        }, {"_id": 0})
    else:
        raise HTTPException(status_code=400, detail="Invalid login parameters")
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    if not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    token_data = {
        "id": user["id"],
        "email": user.get("email"),
        "name": user["name"],
        "role": user["role"],
        "university_id": user.get("university_id"),
        "person_id": user.get("person_id")
    }
    
    return Token(
        access_token=create_token(token_data),
        user=token_data
    )


@auth_router.post("/student/login", response_model=Token)
async def student_login(login_data: StudentLogin):
    """Student login with email and password"""
    user = await db.users.find_one({
        "email": login_data.email,
        "role": "student"
    }, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    if not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    token_data = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "university_id": user.get("university_id")
    }
    
    return Token(
        access_token=create_token(token_data),
        user=token_data
    )


@auth_router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password_hash": 0})
    return serialize_doc(user)


@auth_router.put("/change-password")
async def change_password(
    current_password: str = Body(...),
    new_password: str = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Change current user's password"""
    # Get user with password hash
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not bcrypt.checkpw(current_password.encode('utf-8'), user["password_hash"].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    
    # Hash new password and update
    new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Password changed successfully"}


# ============== SUPER ADMIN ROUTES ==============

@superadmin_router.get("/dashboard")
async def superadmin_dashboard(current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))):
    """Get super admin dashboard stats"""
    total_universities = await db.universities.count_documents({})
    active_universities = await db.universities.count_documents({"is_active": True})
    total_students = await db.users.count_documents({"role": "student"})
    total_leads = await db.leads.count_documents({})
    total_applications = await db.applications.count_documents({})
    
    # Payment stats
    payment_pipeline = [
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1},
            "total": {"$sum": "$amount"}
        }}
    ]
    payment_stats = await db.payments.aggregate(payment_pipeline).to_list(100)
    
    return {
        "universities": {
            "total": total_universities,
            "active": active_universities
        },
        "students": total_students,
        "leads": total_leads,
        "applications": total_applications,
        "payments": {stat["_id"]: {"count": stat["count"], "total": stat["total"]} for stat in payment_stats}
    }


@superadmin_router.post("/universities", response_model=dict)
async def create_university(
    university_data: UniversityCreate,
    current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))
):
    """Create a new university"""
    # Check if code already exists
    existing = await db.universities.find_one({"code": university_data.code})
    if existing:
        raise HTTPException(status_code=400, detail="University code already exists")
    
    university = University(**university_data.model_dump())
    await db.universities.insert_one(university.model_dump())
    
    return serialize_doc(university.model_dump())


@superadmin_router.get("/universities")
async def list_universities(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    status: str = Query(None),
    current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))
):
    """List all universities with pagination"""
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"code": {"$regex": search, "$options": "i"}}
        ]
    if status:
        query["is_active"] = status == "active"
    
    total = await db.universities.count_documents(query)
    universities = await db.universities.find(query, {"_id": 0}).skip((page - 1) * limit).limit(limit).to_list(limit)
    
    return {
        "data": [serialize_doc(u) for u in universities],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@superadmin_router.get("/universities/{university_id}")
async def get_university(
    university_id: str,
    current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))
):
    """Get university details"""
    university = await db.universities.find_one({"id": university_id}, {"_id": 0})
    if not university:
        raise HTTPException(status_code=404, detail="University not found")
    return serialize_doc(university)


@superadmin_router.put("/universities/{university_id}")
async def update_university(
    university_id: str,
    update_data: UniversityUpdate,
    current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))
):
    """Update university details"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.universities.update_one(
        {"id": university_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="University not found")
    
    university = await db.universities.find_one({"id": university_id}, {"_id": 0})
    return serialize_doc(university)


@superadmin_router.post("/universities/{university_id}/create-admin")
async def create_university_admin(
    university_id: str,
    admin_data: dict = Body(...),
    current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))
):
    """Create or update university admin account"""
    university = await db.universities.find_one({"id": university_id})
    if not university:
        raise HTTPException(status_code=404, detail="University not found")
    
    person_id = admin_data.get("person_id")
    password = admin_data.get("password")
    name = admin_data.get("name", f"{university['name']} Admin")
    email = admin_data.get("email", university["email"])
    
    if not person_id or not password:
        raise HTTPException(status_code=400, detail="Person ID and password are required")
    
    # Check if admin already exists
    existing = await db.users.find_one({
        "university_id": university_id,
        "person_id": person_id
    })
    
    if existing:
        # Update password
        await db.users.update_one(
            {"id": existing["id"]},
            {"$set": {
                "password_hash": hash_password(password),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"message": "Admin password updated successfully", "person_id": person_id}
    else:
        # Create new admin
        user = User(
            email=email,
            name=name,
            role=UserRole.UNIVERSITY_ADMIN,
            university_id=university_id,
            person_id=person_id,
            password_hash=hash_password(password)
        )
        await db.users.insert_one(user.model_dump())
        return {"message": "Admin created successfully", "person_id": person_id, "user_id": user.id}


@superadmin_router.get("/system/stats")
async def system_stats(current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))):
    """Get system statistics"""
    # Database stats
    collections = ["users", "universities", "leads", "applications", "payments", "questions", "test_attempts"]
    db_stats = {}
    for coll in collections:
        count = await db[coll].count_documents({})
        db_stats[coll] = count
    
    # Recent activity
    recent_users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(5).to_list(5)
    recent_leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "database_stats": db_stats,
        "recent_users": [serialize_doc(u) for u in recent_users],
        "recent_leads": [serialize_doc(l) for l in recent_leads]
    }


@superadmin_router.get("/system/email-logs")
async def email_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))
):
    """Get email delivery logs"""
    total = await db.email_logs.count_documents({})
    logs = await db.email_logs.find({}, {"_id": 0}).sort("created_at", -1).skip((page - 1) * limit).limit(limit).to_list(limit)
    
    return {
        "data": [serialize_doc(l) for l in logs],
        "total": total,
        "page": page,
        "limit": limit
    }


@superadmin_router.get("/payments/overview")
async def payments_overview(
    current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))
):
    """Get platform-wide payment overview"""
    pipeline = [
        {"$lookup": {
            "from": "universities",
            "localField": "university_id",
            "foreignField": "id",
            "as": "university"
        }},
        {"$unwind": {"path": "$university", "preserveNullAndEmptyArrays": True}},
        {"$group": {
            "_id": "$university_id",
            "university_name": {"$first": "$university.name"},
            "total_collected": {"$sum": {"$cond": [{"$eq": ["$status", "success"]}, "$amount", 0]}},
            "total_refunded": {"$sum": {"$cond": [{"$eq": ["$status", "refunded"]}, "$refund_amount", 0]}},
            "successful_payments": {"$sum": {"$cond": [{"$eq": ["$status", "success"]}, 1, 0]}},
            "failed_payments": {"$sum": {"$cond": [{"$eq": ["$status", "failed"]}, 1, 0]}},
            "pending_transfers": {"$sum": {"$cond": [{"$eq": ["$transfer_status", "pending"]}, "$amount", 0]}},
            "successful_transfers": {"$sum": {"$cond": [{"$eq": ["$transfer_status", "success"]}, "$transfer_amount", 0]}}
        }}
    ]
    
    stats = await db.payments.aggregate(pipeline).to_list(1000)
    
    # Add KYC status from university
    for stat in stats:
        university = await db.universities.find_one({"id": stat["_id"]}, {"_id": 0, "razorpay_config": 1})
        stat["kyc_status"] = university.get("razorpay_config", {}).get("kyc_status", "pending") if university else "pending"
    
    return {"data": stats}


@superadmin_router.get("/analytics")
async def platform_analytics(
    current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))
):
    """Get platform analytics"""
    # University-wise lead counts
    lead_pipeline = [
        {"$group": {"_id": "$university_id", "count": {"$sum": 1}}}
    ]
    leads_by_university = await db.leads.aggregate(lead_pipeline).to_list(1000)
    
    # Application counts by status
    app_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    apps_by_status = await db.applications.aggregate(app_pipeline).to_list(100)
    
    # Lead stage distribution
    stage_pipeline = [
        {"$group": {"_id": "$stage", "count": {"$sum": 1}}}
    ]
    leads_by_stage = await db.leads.aggregate(stage_pipeline).to_list(100)
    
    return {
        "leads_by_university": {item["_id"]: item["count"] for item in leads_by_university if item["_id"]},
        "applications_by_status": {item["_id"]: item["count"] for item in apps_by_status if item["_id"]},
        "leads_by_stage": {item["_id"]: item["count"] for item in leads_by_stage if item["_id"]}
    }


# ============== UNIVERSITY ADMIN ROUTES ==============

@university_router.get("/dashboard")
async def university_dashboard(current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))):
    """Get university admin dashboard"""
    university_id = current_user.get("university_id")
    if not university_id:
        raise HTTPException(status_code=400, detail="University ID required")
    
    total_leads = await db.leads.count_documents({"university_id": university_id})
    total_applications = await db.applications.count_documents({"university_id": university_id})
    total_staff = await db.users.count_documents({
        "university_id": university_id,
        "role": {"$in": ["counselling_manager", "counsellor"]}
    })
    
    # Lead stage distribution
    stage_pipeline = [
        {"$match": {"university_id": university_id}},
        {"$group": {"_id": "$stage", "count": {"$sum": 1}}}
    ]
    leads_by_stage = await db.leads.aggregate(stage_pipeline).to_list(100)
    
    return {
        "total_leads": total_leads,
        "total_applications": total_applications,
        "total_staff": total_staff,
        "leads_by_stage": {item["_id"]: item["count"] for item in leads_by_stage}
    }


@university_router.get("/config")
async def get_university_config(
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Get university registration configuration"""
    university = await db.universities.find_one(
        {"id": current_user["university_id"]},
        {"_id": 0}
    )
    if not university:
        raise HTTPException(status_code=404, detail="University not found")
    return serialize_doc(university)


@university_router.put("/config/registration")
async def update_registration_config(
    config: RegistrationConfigUpdate,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Update registration workflow configuration"""
    update_dict = {}
    for key, value in config.model_dump().items():
        if value is not None:
            update_dict[f"registration_config.{key}"] = value if not hasattr(value, 'value') else value.value
    
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.universities.update_one(
        {"id": current_user["university_id"]},
        {"$set": update_dict}
    )
    
    university = await db.universities.find_one({"id": current_user["university_id"]}, {"_id": 0})
    return serialize_doc(university)


@university_router.put("/profile")
async def update_university_profile(
    about: Optional[str] = Body(None),
    facilities: Optional[List[str]] = Body(None),
    gallery: Optional[List[str]] = Body(None),
    website: Optional[str] = Body(None),
    address: Optional[str] = Body(None),
    phone: Optional[str] = Body(None),
    email: Optional[str] = Body(None),
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Update university profile information"""
    update_dict = {"updated_at": datetime.now(timezone.utc)}
    
    if about is not None:
        update_dict["about"] = about
    if facilities is not None:
        update_dict["facilities"] = facilities
    if gallery is not None:
        update_dict["gallery"] = gallery
    if website is not None:
        update_dict["website"] = website
    if address is not None:
        update_dict["address"] = address
    if phone is not None:
        update_dict["phone"] = phone
    if email is not None:
        update_dict["email"] = email
    
    await db.universities.update_one(
        {"id": current_user["university_id"]},
        {"$set": update_dict}
    )
    
    university = await db.universities.find_one({"id": current_user["university_id"]}, {"_id": 0})
    return {"message": "Profile updated successfully", "data": serialize_doc(university)}


@university_router.post("/gallery/upload")
async def upload_gallery_image(
    file_name: str = Body(...),
    file_type: str = Body(...),
    file_data: str = Body(...),
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Upload a gallery image (base64 encoded)"""
    import base64
    
    # Validate file type
    allowed_types = ["jpg", "jpeg", "png", "webp"]
    ext = file_type.lower().replace(".", "")
    if ext not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed")
    
    # Create upload directory
    upload_dir = Path(f"/app/uploads/gallery/{current_user['university_id']}")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    image_id = str(uuid.uuid4())
    safe_filename = f"{image_id}.{ext}"
    file_path = upload_dir / safe_filename
    
    # Decode and save file
    try:
        file_bytes = base64.b64decode(file_data)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to save file: {str(e)}")
    
    # Generate URL
    image_url = f"/uploads/gallery/{current_user['university_id']}/{safe_filename}"
    
    # Add to university gallery array
    await db.universities.update_one(
        {"id": current_user["university_id"]},
        {
            "$push": {"gallery": image_url},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return {"message": "Image uploaded successfully", "image_url": image_url}


@university_router.delete("/gallery")
async def delete_gallery_image(
    image_url: str = Body(..., embed=True),
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Delete a gallery image"""
    # Remove from array
    await db.universities.update_one(
        {"id": current_user["university_id"]},
        {
            "$pull": {"gallery": image_url},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    # Delete file
    try:
        file_path = Path(f"/app{image_url}")
        if file_path.exists():
            file_path.unlink()
    except Exception:
        pass
    
    return {"message": "Image deleted successfully"}


# Staff Management
@university_router.post("/staff")
async def create_staff(
    staff_data: UserCreate,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Create university staff (Counselling Manager or Counsellor)"""
    if staff_data.role not in [UserRole.COUNSELLING_MANAGER, UserRole.COUNSELLOR]:
        raise HTTPException(status_code=400, detail="Invalid role for staff")
    
    # Check if person_id already exists in this university
    existing = await db.users.find_one({
        "university_id": current_user["university_id"],
        "person_id": staff_data.person_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Person ID already exists")
    
    user = User(
        email=staff_data.email,
        name=staff_data.name,
        role=staff_data.role,
        university_id=current_user["university_id"],
        person_id=staff_data.person_id,
        phone=staff_data.phone,
        password_hash=hash_password(staff_data.password)
    )
    
    await db.users.insert_one(user.model_dump())
    
    # Send credentials email to staff
    if staff_data.email:
        try:
            university = await db.universities.find_one({"id": current_user["university_id"]})
            await email_service.send_staff_credentials_email(
                to_email=staff_data.email,
                to_name=staff_data.name,
                person_id=staff_data.person_id,
                password=staff_data.password,
                role=staff_data.role.value,
                university_name=university.get("name", "UNIFY") if university else "UNIFY"
            )
            # Log the email
            email_log = EmailLog(
                to_email=staff_data.email,
                to_name=staff_data.name,
                subject=f"Your UNIFY Account Credentials",
                email_type=EmailType.USER_CREDENTIALS,
                status=EmailStatus.SENT,
                university_id=current_user["university_id"],
                user_id=user.id
            )
            await db.email_logs.insert_one(email_log.model_dump())
        except Exception as e:
            logger.error(f"Failed to send staff credentials email: {str(e)}")
    
    result = user.model_dump()
    result.pop("password_hash")
    return serialize_doc(result)


@university_router.get("/staff")
async def list_staff(
    role: Optional[str] = None,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN, UserRole.COUNSELLING_MANAGER))
):
    """List university staff"""
    query = {
        "university_id": current_user["university_id"],
        "role": {"$in": ["counselling_manager", "counsellor"]}
    }
    if role:
        query["role"] = role
    
    staff = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    return {"data": [serialize_doc(s) for s in staff]}


@university_router.put("/staff/{user_id}/reset-password")
async def reset_staff_password(
    user_id: str,
    new_password: str = Body(..., embed=True),
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Reset staff password"""
    result = await db.users.update_one(
        {"id": user_id, "university_id": current_user["university_id"]},
        {"$set": {"password_hash": hash_password(new_password)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Password reset successfully"}


# Department Management
@university_router.post("/departments")
async def create_department(
    dept_data: DepartmentCreate,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Create a department"""
    department = Department(
        university_id=current_user["university_id"],
        **dept_data.model_dump()
    )
    await db.departments.insert_one(department.model_dump())
    return serialize_doc(department.model_dump())


@university_router.get("/departments")
async def list_departments(
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN, UserRole.COUNSELLING_MANAGER, UserRole.COUNSELLOR))
):
    """List departments"""
    departments = await db.departments.find(
        {"university_id": current_user["university_id"]},
        {"_id": 0}
    ).to_list(1000)
    return {"data": [serialize_doc(d) for d in departments]}


@university_router.put("/departments/{dept_id}")
async def update_department(
    dept_id: str,
    update_data: DepartmentUpdate,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Update department"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.departments.update_one(
        {"id": dept_id, "university_id": current_user["university_id"]},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    
    dept = await db.departments.find_one({"id": dept_id}, {"_id": 0})
    return serialize_doc(dept)


# Course Management
@university_router.post("/courses")
async def create_course(
    course_data: CourseCreate,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Create a course"""
    course = Course(
        university_id=current_user["university_id"],
        **course_data.model_dump()
    )
    await db.courses.insert_one(course.model_dump())
    return serialize_doc(course.model_dump())


@university_router.get("/courses")
async def list_courses(
    department_id: Optional[str] = None,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN, UserRole.COUNSELLING_MANAGER, UserRole.COUNSELLOR))
):
    """List courses"""
    query = {"university_id": current_user["university_id"]}
    if department_id:
        query["department_id"] = department_id
    
    courses = await db.courses.find(query, {"_id": 0}).to_list(1000)
    return {"data": [serialize_doc(c) for c in courses]}


@university_router.put("/courses/{course_id}")
async def update_course(
    course_id: str,
    update_data: CourseUpdate,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Update course"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.courses.update_one(
        {"id": course_id, "university_id": current_user["university_id"]},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    return serialize_doc(course)


# Session Management
@university_router.post("/sessions")
async def create_session(
    session_data: SessionCreate,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Create an academic session"""
    session = Session(
        university_id=current_user["university_id"],
        **session_data.model_dump()
    )
    await db.sessions.insert_one(session.model_dump())
    return serialize_doc(session.model_dump())


@university_router.get("/sessions")
async def list_sessions(
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN, UserRole.COUNSELLING_MANAGER, UserRole.COUNSELLOR))
):
    """List sessions"""
    sessions = await db.sessions.find(
        {"university_id": current_user["university_id"]},
        {"_id": 0}
    ).to_list(100)
    return {"data": [serialize_doc(s) for s in sessions]}


# ============== LEAD ROUTES ==============

@lead_router.post("")
async def create_lead(
    lead_data: LeadCreate,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN, UserRole.COUNSELLING_MANAGER, UserRole.COUNSELLOR))
):
    """Create a new lead"""
    university_id = current_user["university_id"]
    
    # Check for duplicate (same email or phone in this university)
    existing = await db.leads.find_one({
        "university_id": university_id,
        "$or": [
            {"email": lead_data.email},
            {"phone": lead_data.phone}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Lead with this email or phone already exists")
    
    lead = Lead(
        university_id=university_id,
        **lead_data.model_dump()
    )
    
    # Add creation timeline entry
    lead.timeline.append(TimelineEntry(
        event_type=TimelineEventType.CREATED,
        description="Lead created",
        created_by=current_user["id"],
        created_by_name=current_user["name"]
    ))
    
    await db.leads.insert_one(lead.model_dump())
    return serialize_doc(lead.model_dump())


@lead_router.post("/bulk-upload")
async def bulk_upload_leads(
    leads: List[dict] = Body(..., embed=True),
    current_user: dict = Depends(require_roles(UserRole.COUNSELLING_MANAGER))
):
    """Bulk upload leads from CSV data (Counselling Manager only)"""
    university_id = current_user["university_id"]
    
    created = 0
    failed = 0
    duplicates = 0
    
    for lead_data in leads:
        try:
            # Skip if missing required fields
            if not lead_data.get('name') or not (lead_data.get('email') or lead_data.get('phone')):
                failed += 1
                continue
            
            # Check for duplicate
            query_conditions = []
            if lead_data.get('email'):
                query_conditions.append({"email": lead_data['email']})
            if lead_data.get('phone'):
                query_conditions.append({"phone": lead_data['phone']})
            
            existing = await db.leads.find_one({
                "university_id": university_id,
                "$or": query_conditions
            }) if query_conditions else None
            
            if existing:
                duplicates += 1
                continue
            
            lead = Lead(
                university_id=university_id,
                name=lead_data.get('name', ''),
                email=lead_data.get('email', ''),
                phone=lead_data.get('phone', ''),
                source=lead_data.get('source', 'bulk_upload'),
                course_interest=lead_data.get('course_interest', '')
            )
            
            lead.timeline.append(TimelineEntry(
                event_type=TimelineEventType.CREATED,
                description="Lead imported via bulk upload",
                created_by=current_user["id"],
                created_by_name=current_user["name"]
            ))
            
            await db.leads.insert_one(lead.model_dump())
            created += 1
            
        except Exception as e:
            failed += 1
    
    return {"created": created, "failed": failed, "duplicates": duplicates}


@lead_router.put("/assignment-rules")
async def update_assignment_rules(
    enabled: bool = Body(False),
    method: str = Body("round_robin"),
    max_leads_per_counsellor: int = Body(50),
    current_user: dict = Depends(require_roles(UserRole.COUNSELLING_MANAGER, UserRole.UNIVERSITY_ADMIN))
):
    """Update lead auto-assignment rules"""
    university_id = current_user["university_id"]
    
    await db.universities.update_one(
        {"id": university_id},
        {"$set": {
            "assignment_rules": {
                "enabled": enabled,
                "method": method,
                "max_leads_per_counsellor": max_leads_per_counsellor,
                "updated_at": datetime.now(timezone.utc)
            },
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"message": "Assignment rules updated"}


# ============== THIRD-PARTY LEAD IMPORT ==============

class ThirdPartyLeadImport(PydanticBaseModel):
    """Schema for third-party lead import (Shiksha, Collegedunia, etc.)"""
    source: str  # shiksha, collegedunia, other_api
    leads: List[Dict[str, Any]]
    api_key: Optional[str] = None


@lead_router.post("/import/shiksha")
async def import_shiksha_leads(
    data: ThirdPartyLeadImport,
    current_user: dict = Depends(require_roles(UserRole.COUNSELLING_MANAGER, UserRole.UNIVERSITY_ADMIN))
):
    """Import leads from Shiksha platform"""
    university_id = current_user["university_id"]
    
    created = 0
    failed = 0
    duplicates = 0
    
    for lead_data in data.leads:
        try:
            # Check for duplicates
            query_conditions = []
            if lead_data.get('email'):
                query_conditions.append({"email": lead_data['email']})
            if lead_data.get('phone'):
                query_conditions.append({"phone": lead_data['phone']})
            
            existing = await db.leads.find_one({
                "university_id": university_id,
                "$or": query_conditions
            }) if query_conditions else None
            
            if existing:
                duplicates += 1
                continue
            
            lead = Lead(
                university_id=university_id,
                name=lead_data.get('name', ''),
                email=lead_data.get('email', ''),
                phone=lead_data.get('phone', ''),
                source=LeadSource.SHIKSHA,
                source_details=lead_data.get('campaign', 'Shiksha Import'),
                course_interest=lead_data.get('course_interest', ''),
                notes=[]
            )
            
            # Add initial note with source info
            if lead_data.get('inquiry_details'):
                lead.notes.append(Note(
                    content=f"Shiksha Inquiry: {lead_data.get('inquiry_details')}",
                    created_by="system",
                    created_by_name="System Import"
                ))
            
            lead.timeline.append(TimelineEntry(
                event_type=TimelineEventType.CREATED,
                description=f"Lead imported from Shiksha",
                created_by=current_user["id"],
                created_by_name=current_user["name"],
                metadata={"source": "shiksha", "campaign": lead_data.get('campaign')}
            ))
            
            await db.leads.insert_one(lead.model_dump())
            created += 1
            
        except Exception as e:
            logger.error(f"Failed to import Shiksha lead: {str(e)}")
            failed += 1
    
    return {
        "message": f"Shiksha import complete",
        "created": created, 
        "failed": failed, 
        "duplicates": duplicates,
        "source": "shiksha"
    }


@lead_router.post("/import/collegedunia")
async def import_collegedunia_leads(
    data: ThirdPartyLeadImport,
    current_user: dict = Depends(require_roles(UserRole.COUNSELLING_MANAGER, UserRole.UNIVERSITY_ADMIN))
):
    """Import leads from Collegedunia platform"""
    university_id = current_user["university_id"]
    
    created = 0
    failed = 0
    duplicates = 0
    
    for lead_data in data.leads:
        try:
            # Check for duplicates
            query_conditions = []
            if lead_data.get('email'):
                query_conditions.append({"email": lead_data['email']})
            if lead_data.get('phone'):
                query_conditions.append({"phone": lead_data['phone']})
            
            existing = await db.leads.find_one({
                "university_id": university_id,
                "$or": query_conditions
            }) if query_conditions else None
            
            if existing:
                duplicates += 1
                continue
            
            lead = Lead(
                university_id=university_id,
                name=lead_data.get('name', ''),
                email=lead_data.get('email', ''),
                phone=lead_data.get('phone', ''),
                source=LeadSource.COLLEGEDUNIA,
                source_details=lead_data.get('campaign', 'Collegedunia Import'),
                course_interest=lead_data.get('course_interest', ''),
                notes=[]
            )
            
            # Add initial note with source info
            if lead_data.get('inquiry_details'):
                lead.notes.append(Note(
                    content=f"Collegedunia Inquiry: {lead_data.get('inquiry_details')}",
                    created_by="system",
                    created_by_name="System Import"
                ))
            
            lead.timeline.append(TimelineEntry(
                event_type=TimelineEventType.CREATED,
                description=f"Lead imported from Collegedunia",
                created_by=current_user["id"],
                created_by_name=current_user["name"],
                metadata={"source": "collegedunia", "campaign": lead_data.get('campaign')}
            ))
            
            await db.leads.insert_one(lead.model_dump())
            created += 1
            
        except Exception as e:
            logger.error(f"Failed to import Collegedunia lead: {str(e)}")
            failed += 1
    
    return {
        "message": f"Collegedunia import complete",
        "created": created, 
        "failed": failed, 
        "duplicates": duplicates,
        "source": "collegedunia"
    }


@lead_router.post("/import/webhook")
async def lead_import_webhook(
    request: Request,
    source: str = Query(..., description="Lead source: shiksha, collegedunia, other"),
    api_key: str = Query(..., description="API key for authentication")
):
    """Webhook endpoint for third-party lead imports (no auth required, uses API key)"""
    # Validate API key against university settings
    university = await db.universities.find_one({
        "integration_settings.lead_import_api_key": api_key
    })
    
    if not university:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    body = await request.json()
    leads = body.get('leads', [body]) if isinstance(body, dict) else body
    
    created = 0
    failed = 0
    duplicates = 0
    
    source_enum = {
        'shiksha': LeadSource.SHIKSHA,
        'collegedunia': LeadSource.COLLEGEDUNIA
    }.get(source, LeadSource.OTHER_API)
    
    for lead_data in leads:
        try:
            query_conditions = []
            if lead_data.get('email'):
                query_conditions.append({"email": lead_data['email']})
            if lead_data.get('phone'):
                query_conditions.append({"phone": lead_data['phone']})
            
            existing = await db.leads.find_one({
                "university_id": university["id"],
                "$or": query_conditions
            }) if query_conditions else None
            
            if existing:
                duplicates += 1
                continue
            
            lead = Lead(
                university_id=university["id"],
                name=lead_data.get('name', lead_data.get('student_name', '')),
                email=lead_data.get('email', lead_data.get('student_email', '')),
                phone=lead_data.get('phone', lead_data.get('mobile', '')),
                source=source_enum,
                source_details=f"Webhook import from {source}",
                course_interest=lead_data.get('course_interest', lead_data.get('course', '')),
            )
            
            lead.timeline.append(TimelineEntry(
                event_type=TimelineEventType.CREATED,
                description=f"Lead received via {source} webhook",
                created_by="webhook",
                created_by_name="System Webhook",
                metadata={"source": source, "raw_data": lead_data}
            ))
            
            await db.leads.insert_one(lead.model_dump())
            created += 1
            
        except Exception as e:
            logger.error(f"Failed to process webhook lead: {str(e)}")
            failed += 1
    
    return {"status": "success", "created": created, "failed": failed, "duplicates": duplicates}


@lead_router.get("")
async def list_leads(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    stage: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN, UserRole.COUNSELLING_MANAGER, UserRole.COUNSELLOR))
):
    """List leads with filtering"""
    query = {"university_id": current_user["university_id"]}
    
    # Counsellors can only see their assigned leads
    if current_user["role"] == "counsellor":
        query["assigned_to"] = current_user["id"]
    elif assigned_to:
        query["assigned_to"] = assigned_to
    
    if stage:
        query["stage"] = stage
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    total = await db.leads.count_documents(query)
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).skip((page - 1) * limit).limit(limit).to_list(limit)
    
    return {
        "data": [serialize_doc(l) for l in leads],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@lead_router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN, UserRole.COUNSELLING_MANAGER, UserRole.COUNSELLOR))
):
    """Get lead details with full timeline"""
    query = {"id": lead_id, "university_id": current_user["university_id"]}
    
    # Counsellors can only see their assigned leads
    if current_user["role"] == "counsellor":
        query["assigned_to"] = current_user["id"]
    
    lead = await db.leads.find_one(query, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return serialize_doc(lead)


@lead_router.put("/{lead_id}/stage")
async def update_lead_stage(
    lead_id: str,
    stage_update: LeadStageUpdate,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN, UserRole.COUNSELLING_MANAGER, UserRole.COUNSELLOR))
):
    """Update lead stage"""
    query = {"id": lead_id, "university_id": current_user["university_id"]}
    
    # Counsellors can only update their assigned leads
    if current_user["role"] == "counsellor":
        query["assigned_to"] = current_user["id"]
    
    lead = await db.leads.find_one(query)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    old_stage = lead.get("stage")
    
    # Update stage and add timeline entry
    await db.leads.update_one(
        {"id": lead_id},
        {
            "$set": {
                "stage": stage_update.stage.value,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    await add_timeline_entry(
        lead_id=lead_id,
        event_type=TimelineEventType.STATUS_CHANGED,
        description=f"Stage changed from {old_stage} to {stage_update.stage.value}",
        user_id=current_user["id"],
        user_name=current_user["name"],
        metadata={"old_stage": old_stage, "new_stage": stage_update.stage.value, "notes": stage_update.notes}
    )
    
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    return serialize_doc(lead)


@lead_router.post("/{lead_id}/assign")
async def assign_lead(
    lead_id: str,
    counsellor_id: str = Body(..., embed=True),
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN, UserRole.COUNSELLING_MANAGER))
):
    """Assign lead to a counsellor"""
    # Verify counsellor exists
    counsellor = await db.users.find_one({
        "id": counsellor_id,
        "university_id": current_user["university_id"],
        "role": "counsellor"
    })
    if not counsellor:
        raise HTTPException(status_code=404, detail="Counsellor not found")
    
    lead = await db.leads.find_one({"id": lead_id, "university_id": current_user["university_id"]})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    old_assignee = lead.get("assigned_to_name")
    
    await db.leads.update_one(
        {"id": lead_id},
        {
            "$set": {
                "assigned_to": counsellor_id,
                "assigned_to_name": counsellor["name"],
                "assigned_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    event_type = TimelineEventType.REASSIGNED if old_assignee else TimelineEventType.ASSIGNED
    await add_timeline_entry(
        lead_id=lead_id,
        event_type=event_type,
        description=f"Assigned to {counsellor['name']}" + (f" (from {old_assignee})" if old_assignee else ""),
        user_id=current_user["id"],
        user_name=current_user["name"],
        metadata={"counsellor_id": counsellor_id, "counsellor_name": counsellor["name"]}
    )
    
    # Send email notification to counsellor
    if counsellor.get("email"):
        try:
            await email_service.send_lead_assignment_email(
                to_email=counsellor["email"],
                to_name=counsellor["name"],
                lead_name=lead.get("name", "Unknown"),
                lead_email=lead.get("email", "N/A"),
                lead_phone=lead.get("phone", "N/A")
            )
            # Log the email
            email_log = EmailLog(
                to_email=counsellor["email"],
                to_name=counsellor["name"],
                subject=f"New Lead Assigned: {lead.get('name')}",
                email_type=EmailType.LEAD_ASSIGNMENT,
                status=EmailStatus.SENT,
                university_id=current_user["university_id"],
                user_id=counsellor_id,
                lead_id=lead_id
            )
            await db.email_logs.insert_one(email_log.model_dump())
        except Exception as e:
            logger.error(f"Failed to send lead assignment email: {str(e)}")
    
    return {"message": "Lead assigned successfully"}


@lead_router.post("/bulk-reassign")
async def bulk_reassign_leads(
    reassign_data: LeadBulkReassign,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN, UserRole.COUNSELLING_MANAGER))
):
    """Bulk reassign leads to another counsellor"""
    # Verify new counsellor exists
    new_counsellor = await db.users.find_one({
        "id": reassign_data.to_counsellor_id,
        "university_id": current_user["university_id"],
        "role": "counsellor"
    })
    if not new_counsellor:
        raise HTTPException(status_code=404, detail="Target counsellor not found")
    
    # Get leads to reassign
    query = {
        "id": {"$in": reassign_data.lead_ids},
        "university_id": current_user["university_id"]
    }
    if reassign_data.from_counsellor_id:
        query["assigned_to"] = reassign_data.from_counsellor_id
    
    leads = await db.leads.find(query).to_list(len(reassign_data.lead_ids))
    
    if not leads:
        raise HTTPException(status_code=404, detail="No matching leads found")
    
    # Update all leads
    await db.leads.update_many(
        {"id": {"$in": [l["id"] for l in leads]}},
        {
            "$set": {
                "assigned_to": reassign_data.to_counsellor_id,
                "assigned_to_name": new_counsellor["name"],
                "assigned_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Add timeline entries for each lead
    for lead in leads:
        old_assignee = lead.get("assigned_to_name", "Unassigned")
        await add_timeline_entry(
            lead_id=lead["id"],
            event_type=TimelineEventType.REASSIGNED,
            description=f"Reassigned from {old_assignee} to {new_counsellor['name']}",
            user_id=current_user["id"],
            user_name=current_user["name"],
            metadata={
                "from_counsellor_id": lead.get("assigned_to"),
                "to_counsellor_id": reassign_data.to_counsellor_id,
                "reason": reassign_data.reason
            }
        )
    
    return {"message": f"Successfully reassigned {len(leads)} leads"}


@lead_router.post("/{lead_id}/notes")
async def add_lead_note(
    lead_id: str,
    note_data: LeadNote,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN, UserRole.COUNSELLING_MANAGER, UserRole.COUNSELLOR))
):
    """Add a note to lead"""
    query = {"id": lead_id, "university_id": current_user["university_id"]}
    if current_user["role"] == "counsellor":
        query["assigned_to"] = current_user["id"]
    
    lead = await db.leads.find_one(query)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    note = Note(
        content=note_data.content,
        created_by=current_user["id"],
        created_by_name=current_user["name"]
    )
    
    await db.leads.update_one(
        {"id": lead_id},
        {
            "$push": {"notes": note.model_dump()},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    await add_timeline_entry(
        lead_id=lead_id,
        event_type=TimelineEventType.NOTE_ADDED,
        description="Note added",
        user_id=current_user["id"],
        user_name=current_user["name"],
        metadata={"note_id": note.id}
    )
    
    return serialize_doc(note.model_dump())


@lead_router.post("/{lead_id}/follow-ups")
async def add_follow_up(
    lead_id: str,
    follow_up_data: LeadFollowUp,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN, UserRole.COUNSELLING_MANAGER, UserRole.COUNSELLOR))
):
    """Schedule a follow-up"""
    query = {"id": lead_id, "university_id": current_user["university_id"]}
    if current_user["role"] == "counsellor":
        query["assigned_to"] = current_user["id"]
    
    lead = await db.leads.find_one(query)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    follow_up = FollowUp(
        scheduled_at=follow_up_data.scheduled_at,
        notes=follow_up_data.notes,
        created_by=current_user["id"]
    )
    
    await db.leads.update_one(
        {"id": lead_id},
        {
            "$push": {"follow_ups": follow_up.model_dump()},
            "$set": {
                "next_follow_up": follow_up_data.scheduled_at.isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    await add_timeline_entry(
        lead_id=lead_id,
        event_type=TimelineEventType.FOLLOW_UP_SET,
        description=f"Follow-up scheduled for {follow_up_data.scheduled_at.strftime('%Y-%m-%d %H:%M')}",
        user_id=current_user["id"],
        user_name=current_user["name"],
        metadata={"follow_up_id": follow_up.id, "scheduled_at": follow_up_data.scheduled_at.isoformat()}
    )
    
    return serialize_doc(follow_up.model_dump())


# ============== APPLICATION ROUTES ==============

@application_router.post("")
async def create_application(
    app_data: ApplicationCreate,
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Create a new application (student)"""
    # Check if student already has an application for this university
    existing = await db.applications.find_one({
        "university_id": current_user["university_id"],
        "student_id": current_user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have an application for this university")
    
    application = Application(
        university_id=current_user["university_id"],
        student_id=current_user["id"],
        **app_data.model_dump()
    )
    
    await db.applications.insert_one(application.model_dump())
    return serialize_doc(application.model_dump())


@application_router.get("/my-applications")
async def get_my_applications(
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Get student's applications"""
    applications = await db.applications.find(
        {"student_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    return {"data": [serialize_doc(a) for a in applications]}


@application_router.get("/{application_id}")
async def get_application(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get application details"""
    query = {"id": application_id}
    
    # Students can only see their own applications
    if current_user["role"] == "student":
        query["student_id"] = current_user["id"]
    # Staff can see applications from their university
    elif current_user.get("university_id"):
        query["university_id"] = current_user["university_id"]
    
    application = await db.applications.find_one(query, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return serialize_doc(application)


@application_router.put("/{application_id}/basic-info")
async def update_basic_info(
    application_id: str,
    basic_info: ApplicationBasicInfo,
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Update application basic info (Step 1)"""
    application = await db.applications.find_one({
        "id": application_id,
        "student_id": current_user["id"]
    })
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    completed_steps = application.get("completed_steps", [])
    if "basic_info" not in completed_steps:
        completed_steps.append("basic_info")
    
    await db.applications.update_one(
        {"id": application_id},
        {
            "$set": {
                "basic_info": basic_info.model_dump(),
                "completed_steps": completed_steps,
                "current_step": "educational_details",
                "status": "in_progress",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    return serialize_doc(application)


@application_router.put("/{application_id}/educational-details")
async def update_educational_details(
    application_id: str,
    details: List[ApplicationEducationalDetails],
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Update educational details (Step 2)"""
    application = await db.applications.find_one({
        "id": application_id,
        "student_id": current_user["id"]
    })
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    completed_steps = application.get("completed_steps", [])
    if "educational_details" not in completed_steps:
        completed_steps.append("educational_details")
    
    await db.applications.update_one(
        {"id": application_id},
        {
            "$set": {
                "educational_details": [d.model_dump() for d in details],
                "completed_steps": completed_steps,
                "current_step": "documents",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    return serialize_doc(application)


@application_router.post("/{application_id}/submit")
async def submit_application(
    application_id: str,
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Final submission of application"""
    application = await db.applications.find_one({
        "id": application_id,
        "student_id": current_user["id"]
    })
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Verify all required steps are completed
    university = await db.universities.find_one({"id": application["university_id"]})
    config = university.get("registration_config", {})
    
    required_steps = ["basic_info"]
    if config.get("educational_details_enabled", True):
        required_steps.append("educational_details")
    if config.get("documents_enabled", True):
        required_steps.append("documents")
    if config.get("entrance_test_enabled", False):
        required_steps.append("entrance_test")
    if config.get("fee_enabled", False):
        required_steps.append("payment")
    
    completed = application.get("completed_steps", [])
    missing = [s for s in required_steps if s not in completed]
    
    if missing:
        raise HTTPException(status_code=400, detail=f"Please complete: {', '.join(missing)}")
    
    completed.append("final_submission")
    
    await db.applications.update_one(
        {"id": application_id},
        {
            "$set": {
                "status": "submitted",
                "current_step": "final_submission",
                "completed_steps": completed,
                "submitted_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Update lead stage if exists
    if application.get("lead_id"):
        await db.leads.update_one(
            {"id": application["lead_id"]},
            {"$set": {"stage": "documents_submitted"}}
        )
    
    # Send application status email
    student = await db.users.find_one({"id": current_user["id"]})
    if student and student.get("email"):
        try:
            await email_service.send_application_status_email(
                to_email=student["email"],
                to_name=student.get("name", "Student"),
                application_number=application.get("application_number", application_id[:8]),
                status="submitted",
                message="Your application has been successfully submitted. We will review it and get back to you soon."
            )
            # Log the email
            email_log = EmailLog(
                to_email=student["email"],
                to_name=student.get("name"),
                subject=f"Application Status Update",
                email_type=EmailType.APPLICATION_STATUS,
                status=EmailStatus.SENT,
                university_id=application["university_id"],
                user_id=current_user["id"],
                application_id=application_id
            )
            await db.email_logs.insert_one(email_log.model_dump())
        except Exception as e:
            logger.error(f"Failed to send application status email: {str(e)}")
    
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    return serialize_doc(application)


# ============== TEST ROUTES ==============

@test_router.post("/questions")
async def create_question(
    question_data: QuestionCreate,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Create a question"""
    question = Question(
        university_id=current_user["university_id"],
        **question_data.model_dump()
    )
    await db.questions.insert_one(question.model_dump())
    return serialize_doc(question.model_dump())


@test_router.get("/questions")
async def list_questions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    department_id: Optional[str] = None,
    course_id: Optional[str] = None,
    subject: Optional[str] = None,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """List questions"""
    query = {"university_id": current_user["university_id"], "is_active": True}
    if department_id:
        query["department_id"] = department_id
    if course_id:
        query["course_id"] = course_id
    if subject:
        query["subject"] = subject
    
    total = await db.questions.count_documents(query)
    questions = await db.questions.find(query, {"_id": 0}).skip((page - 1) * limit).limit(limit).to_list(limit)
    
    return {
        "data": [serialize_doc(q) for q in questions],
        "total": total,
        "page": page,
        "limit": limit
    }


@test_router.post("/configs")
async def create_test_config(
    config_data: TestConfigCreate,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Create test configuration"""
    config = TestConfig(
        university_id=current_user["university_id"],
        **config_data.model_dump()
    )
    await db.test_configs.insert_one(config.model_dump())
    return serialize_doc(config.model_dump())


@test_router.get("/configs")
async def list_test_configs(
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """List test configurations"""
    configs = await db.test_configs.find(
        {"university_id": current_user["university_id"], "is_active": True},
        {"_id": 0}
    ).to_list(100)
    return {"data": [serialize_doc(c) for c in configs]}


@test_router.post("/start/{application_id}")
async def start_test(
    application_id: str,
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Start entrance test for application"""
    application = await db.applications.find_one({
        "id": application_id,
        "student_id": current_user["id"]
    })
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if already attempted
    existing_attempt = await db.test_attempts.find_one({
        "application_id": application_id,
        "status": {"$in": ["in_progress", "submitted"]}
    })
    if existing_attempt:
        if existing_attempt["status"] == "in_progress":
            return serialize_doc(existing_attempt)
        raise HTTPException(status_code=400, detail="Test already completed")
    
    # Get test config for this course/university
    university = await db.universities.find_one({"id": application["university_id"]})
    test_config = await db.test_configs.find_one({
        "university_id": application["university_id"],
        "is_active": True,
        "$or": [
            {"course_id": application.get("course_id")},
            {"course_id": None}
        ]
    })
    
    if not test_config:
        raise HTTPException(status_code=404, detail="No test configured")
    
    # Get random questions
    pipeline = [
        {"$match": {
            "university_id": application["university_id"],
            "is_active": True
        }},
        {"$sample": {"size": test_config.get("total_questions", 50)}}
    ]
    questions = await db.questions.aggregate(pipeline).to_list(test_config.get("total_questions", 50))
    
    # Prepare questions for student (without correct answers)
    student_questions = []
    for q in questions:
        student_questions.append({
            "id": q["id"],
            "question_text": q["question_text"],
            "question_type": q["question_type"],
            "options": q["options"],
            "marks": q["marks"],
            "negative_marks": q.get("negative_marks", 0)
        })
    
    # Create attempt
    attempt = TestAttempt(
        university_id=application["university_id"],
        student_id=current_user["id"],
        application_id=application_id,
        test_config_id=test_config["id"],
        questions=student_questions,
        status="in_progress",
        started_at=datetime.now(timezone.utc),
        time_remaining_seconds=test_config.get("duration_minutes", 60) * 60
    )
    
    await db.test_attempts.insert_one(attempt.model_dump())
    
    return serialize_doc(attempt.model_dump())


@test_router.post("/submit/{attempt_id}")
async def submit_test(
    attempt_id: str,
    submission: TestSubmit,
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Submit test answers"""
    attempt = await db.test_attempts.find_one({
        "id": attempt_id,
        "student_id": current_user["id"],
        "status": "in_progress"
    })
    if not attempt:
        raise HTTPException(status_code=404, detail="Test attempt not found or already submitted")
    
    # Save responses
    await db.test_attempts.update_one(
        {"id": attempt_id},
        {
            "$set": {
                "responses": submission.responses,
                "status": "submitted",
                "submitted_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Calculate results
    questions_with_answers = await db.questions.find(
        {"id": {"$in": [q["id"] for q in attempt["questions"]]}},
        {"_id": 0}
    ).to_list(len(attempt["questions"]))
    
    questions_map = {q["id"]: q for q in questions_with_answers}
    
    correct = 0
    incorrect = 0
    unanswered = 0
    marks_obtained = 0
    total_marks = 0
    question_results = []
    
    for q in attempt["questions"]:
        q_id = q["id"]
        q_data = questions_map.get(q_id, {})
        total_marks += q.get("marks", 1)
        
        student_answer = submission.responses.get(q_id, [])
        correct_answer = q_data.get("correct_options", [])
        
        result = {
            "question_id": q_id,
            "student_answer": student_answer,
            "correct_answer": correct_answer,
            "marks": q.get("marks", 1),
            "is_correct": False
        }
        
        if not student_answer:
            unanswered += 1
            result["status"] = "unanswered"
        elif sorted(student_answer) == sorted(correct_answer):
            correct += 1
            marks_obtained += q.get("marks", 1)
            result["is_correct"] = True
            result["status"] = "correct"
        else:
            incorrect += 1
            marks_obtained -= q.get("negative_marks", 0)
            result["status"] = "incorrect"
        
        question_results.append(result)
    
    # Get test config for passing marks
    test_config = await db.test_configs.find_one({"id": attempt["test_config_id"]})
    passing_marks = test_config.get("passing_marks", total_marks * 0.4)
    
    test_result = TestResult(
        attempt_id=attempt_id,
        student_id=current_user["id"],
        application_id=attempt["application_id"],
        total_questions=len(attempt["questions"]),
        attempted=correct + incorrect,
        correct=correct,
        incorrect=incorrect,
        unanswered=unanswered,
        marks_obtained=marks_obtained,
        total_marks=total_marks,
        percentage=round((marks_obtained / total_marks) * 100, 2) if total_marks > 0 else 0,
        passed=marks_obtained >= passing_marks,
        passing_marks=passing_marks,
        question_results=question_results
    )
    
    await db.test_results.insert_one(test_result.model_dump())
    
    # Update application
    await db.applications.update_one(
        {"id": attempt["application_id"]},
        {
            "$set": {
                "test_attempt_id": attempt_id,
                "test_score": marks_obtained,
                "test_passed": test_result.passed,
                "current_step": "payment" if test_result.passed else "entrance_test",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$addToSet": {"completed_steps": "entrance_test"}
        }
    )
    
    return serialize_doc(test_result.model_dump())


# ============== PAYMENT ROUTES ==============

@payment_router.post("/create-order")
async def create_payment_order(
    payment_data: PaymentCreate,
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Create a Razorpay order for payment"""
    application = await db.applications.find_one({
        "id": payment_data.application_id,
        "student_id": current_user["id"]
    })
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    university = await db.universities.find_one({"id": application["university_id"]})
    
    # Create payment record
    payment = Payment(
        university_id=application["university_id"],
        student_id=current_user["id"],
        application_id=payment_data.application_id,
        amount=payment_data.amount,
        fee_type=payment_data.fee_type
    )
    
    # If Razorpay is configured, create order
    if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
        import razorpay
        rz_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        
        order_data = {
            "amount": int(payment_data.amount * 100),  # Convert to paise
            "currency": "INR",
            "receipt": payment.id,
            "payment_capture": 1
        }
        
        # Add linked account for transfer if configured
        linked_account = university.get("razorpay_config", {}).get("linked_account_id")
        if linked_account:
            order_data["transfers"] = [{
                "account": linked_account,
                "amount": int(payment_data.amount * 100),
                "currency": "INR",
                "on_hold": False
            }]
        
        rz_order = rz_client.order.create(order_data)
        payment.razorpay_order_id = rz_order["id"]
    else:
        # Mock order ID for testing
        payment.razorpay_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
    
    await db.payments.insert_one(payment.model_dump())
    
    return {
        "payment_id": payment.id,
        "razorpay_order_id": payment.razorpay_order_id,
        "amount": payment.amount,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID or "mock_key"
    }


@payment_router.post("/verify")
async def verify_payment(
    verify_data: PaymentVerify,
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Verify Razorpay payment"""
    payment = await db.payments.find_one({
        "razorpay_order_id": verify_data.razorpay_order_id,
        "student_id": current_user["id"]
    })
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Verify signature
    if RAZORPAY_KEY_SECRET:
        import razorpay
        rz_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        
        try:
            rz_client.utility.verify_payment_signature({
                'razorpay_order_id': verify_data.razorpay_order_id,
                'razorpay_payment_id': verify_data.razorpay_payment_id,
                'razorpay_signature': verify_data.razorpay_signature
            })
        except Exception as e:
            await db.payments.update_one(
                {"id": payment["id"]},
                {"$set": {"status": "failed", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Update payment status
    await db.payments.update_one(
        {"id": payment["id"]},
        {
            "$set": {
                "razorpay_payment_id": verify_data.razorpay_payment_id,
                "razorpay_signature": verify_data.razorpay_signature,
                "status": "success",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Update application
    await db.applications.update_one(
        {"id": payment["application_id"]},
        {
            "$set": {
                "payment_id": payment["id"],
                "payment_status": "success",
                "current_step": "final_submission",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$addToSet": {"completed_steps": "payment"}
        }
    )
    
    # Update lead stage if exists
    application = await db.applications.find_one({"id": payment["application_id"]})
    if application and application.get("lead_id"):
        await db.leads.update_one(
            {"id": application["lead_id"]},
            {"$set": {"stage": "fee_paid"}}
        )
        await add_timeline_entry(
            lead_id=application["lead_id"],
            event_type=TimelineEventType.PAYMENT_SUCCESS,
            description=f"Payment of ₹{payment['amount']} successful",
            metadata={"payment_id": payment["id"], "amount": payment["amount"]}
        )
    
    # Send payment receipt email
    student = await db.users.find_one({"id": payment["student_id"]})
    university = await db.universities.find_one({"id": payment["university_id"]})
    if student and student.get("email"):
        try:
            await email_service.send_payment_receipt_email(
                to_email=student["email"],
                to_name=student.get("name", "Student"),
                amount=payment["amount"],
                payment_id=payment["id"],
                fee_type=payment.get("fee_type", "Registration Fee"),
                university_name=university.get("name", "UNIFY") if university else "UNIFY"
            )
            # Log the email
            email_log = EmailLog(
                to_email=student["email"],
                to_name=student.get("name"),
                subject=f"Payment Receipt - {university.get('name', 'UNIFY') if university else 'UNIFY'}",
                email_type=EmailType.PAYMENT_RECEIPT,
                status=EmailStatus.SENT,
                university_id=payment["university_id"],
                user_id=payment["student_id"],
                application_id=payment["application_id"]
            )
            await db.email_logs.insert_one(email_log.model_dump())
        except Exception as e:
            logger.error(f"Failed to send payment receipt email: {str(e)}")
    
    return {"message": "Payment verified successfully", "status": "success"}


@payment_router.get("/my-payments")
async def get_my_payments(current_user: dict = Depends(require_roles(UserRole.STUDENT))):
    """Get student's own payments"""
    payments = await db.payments.find(
        {"student_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"data": [serialize_doc(p) for p in payments]}


@payment_router.post("/{payment_id}/refund")
async def initiate_refund(
    payment_id: str,
    refund_data: Refund,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN))
):
    """Initiate refund for a payment"""
    payment = await db.payments.find_one({
        "id": payment_id,
        "university_id": current_user["university_id"],
        "status": "success"
    })
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found or not eligible for refund")
    
    refund_amount = refund_data.amount or payment["amount"]
    
    # Process refund via Razorpay
    if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET and payment.get("razorpay_payment_id"):
        import razorpay
        rz_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        
        try:
            refund = rz_client.payment.refund(payment["razorpay_payment_id"], {
                "amount": int(refund_amount * 100),
                "notes": {"reason": refund_data.reason}
            })
            refund_id = refund["id"]
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Refund failed: {str(e)}")
    else:
        refund_id = f"rfnd_mock_{uuid.uuid4().hex[:12]}"
    
    # Update payment
    new_status = "refunded" if refund_amount >= payment["amount"] else "partially_refunded"
    await db.payments.update_one(
        {"id": payment_id},
        {
            "$set": {
                "refund_id": refund_id,
                "refund_amount": refund_amount,
                "refund_status": "processed",
                "refund_reason": refund_data.reason,
                "refunded_at": datetime.now(timezone.utc).isoformat(),
                "refunded_by": current_user["id"],
                "status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Update lead timeline
    application = await db.applications.find_one({"id": payment["application_id"]})
    if application and application.get("lead_id"):
        await add_timeline_entry(
            lead_id=application["lead_id"],
            event_type=TimelineEventType.REFUND_COMPLETED,
            description=f"Refund of ₹{refund_amount} processed",
            user_id=current_user["id"],
            user_name=current_user["name"],
            metadata={"refund_id": refund_id, "amount": refund_amount, "reason": refund_data.reason}
        )
    
    return {"message": "Refund processed", "refund_id": refund_id}


@payment_router.get("")
async def list_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN, UserRole.SUPER_ADMIN))
):
    """List payments"""
    query = {}
    if current_user["role"] != "super_admin":
        query["university_id"] = current_user["university_id"]
    if status:
        query["status"] = status
    
    total = await db.payments.count_documents(query)
    payments = await db.payments.find(query, {"_id": 0}).sort("created_at", -1).skip((page - 1) * limit).limit(limit).to_list(limit)
    
    return {
        "data": [serialize_doc(p) for p in payments],
        "total": total,
        "page": page,
        "limit": limit
    }


# ============== STUDENT PORTAL ROUTES ==============

@student_router.post("/register")
async def student_register(
    registration_data: dict = Body(...),
    university_code: str = Body(...)
):
    """Student self-registration"""
    # Find university
    university = await db.universities.find_one({"code": university_code, "is_active": True})
    if not university:
        raise HTTPException(status_code=404, detail="University not found")
    
    # Check for existing student
    existing = await db.users.find_one({
        "email": registration_data["email"],
        "university_id": university["id"],
        "role": "student"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create student user
    password = registration_data.get("password", str(uuid.uuid4())[:8])
    student = User(
        email=registration_data["email"],
        name=registration_data["name"],
        phone=registration_data.get("phone"),
        role=UserRole.STUDENT,
        university_id=university["id"],
        password_hash=hash_password(password)
    )
    
    await db.users.insert_one(student.model_dump())
    
    # Create lead
    lead = Lead(
        university_id=university["id"],
        name=registration_data["name"],
        email=registration_data["email"],
        phone=registration_data.get("phone", ""),
        source=LeadSource.WEBSITE
    )
    lead.timeline.append(TimelineEntry(
        event_type=TimelineEventType.CREATED,
        description="Lead created via student registration"
    ))
    await db.leads.insert_one(lead.model_dump())
    
    # Create application
    application = Application(
        university_id=university["id"],
        student_id=student.id,
        lead_id=lead.id
    )
    await db.applications.insert_one(application.model_dump())
    
    # Update lead with application
    await db.leads.update_one(
        {"id": lead.id},
        {"$set": {"application_id": application.id, "stage": "application_started"}}
    )
    
    # Generate token
    token_data = {
        "id": student.id,
        "email": student.email,
        "name": student.name,
        "role": "student",
        "university_id": university["id"]
    }
    
    # Send welcome email (non-blocking)
    try:
        await email_service.send_welcome_email(
            to_email=student.email,
            to_name=student.name,
            university_name=university.get("name", "UNIFY")
        )
        # Log the email
        email_log = EmailLog(
            to_email=student.email,
            to_name=student.name,
            subject=f"Welcome to {university.get('name', 'UNIFY')}",
            email_type=EmailType.STUDENT_REGISTRATION,
            status=EmailStatus.SENT,
            university_id=university["id"],
            user_id=student.id
        )
        await db.email_logs.insert_one(email_log.model_dump())
    except Exception as e:
        logger.error(f"Failed to send welcome email: {str(e)}")
    
    return {
        "message": "Registration successful",
        "access_token": create_token(token_data),
        "user": token_data,
        "application_id": application.id
    }


@student_router.get("/registration-config")
async def get_registration_config(
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Get registration workflow configuration for student"""
    university = await db.universities.find_one(
        {"id": current_user["university_id"]},
        {"_id": 0, "registration_config": 1, "name": 1}
    )
    if not university:
        raise HTTPException(status_code=404, detail="University not found")
    
    config = university.get("registration_config", {})
    
    # Build steps list based on config
    steps = [
        {"step": "basic_info", "name": "Basic Information", "enabled": True, "order": 1}
    ]
    
    if config.get("educational_details_enabled", True):
        steps.append({"step": "educational_details", "name": "Educational Details", "enabled": True, "order": 2})
    
    if config.get("documents_enabled", True):
        steps.append({
            "step": "documents",
            "name": "Document Upload",
            "enabled": True,
            "order": 3,
            "required_documents": config.get("required_documents", [])
        })
    
    if config.get("entrance_test_enabled", False):
        steps.append({"step": "entrance_test", "name": "Entrance Test", "enabled": True, "order": 4})
    
    if config.get("fee_enabled", False):
        steps.append({
            "step": "payment",
            "name": "Registration Fee",
            "enabled": True,
            "order": 5,
            "fee_amount": config.get("fee_amount", 0)
        })
    
    steps.append({"step": "final_submission", "name": "Final Submission", "enabled": True, "order": 6})
    
    return {
        "university_name": university.get("name"),
        "steps": steps,
        "config": config
    }


@student_router.get("/university-info")
async def get_university_info(
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Get Know Your Institution info"""
    university = await db.universities.find_one(
        {"id": current_user["university_id"]},
        {"_id": 0, "name": 1, "about": 1, "facilities": 1, "gallery": 1, "brochures": 1, "website": 1, "address": 1, "phone": 1, "email": 1}
    )
    if not university:
        raise HTTPException(status_code=404, detail="University not found")
    return serialize_doc(university)


# ============== DOCUMENT ROUTES ==============

document_router = APIRouter(prefix="/documents", tags=["Documents"])

@document_router.post("/upload")
async def upload_document(
    application_id: str = Body(...),
    document_name: str = Body(...),
    file_name: str = Body(...),
    file_type: str = Body(...),
    file_size: int = Body(...),
    file_data: str = Body(...),  # Base64 encoded file data
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Upload a document for an application"""
    import base64
    
    # Verify application belongs to student
    application = await db.applications.find_one({
        "id": application_id,
        "student_id": current_user["id"]
    })
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Validate file type
    allowed_types = ["pdf", "jpg", "jpeg", "png"]
    ext = file_type.lower().replace(".", "")
    if ext not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed. Allowed: {', '.join(allowed_types)}")
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
    
    # Create upload directory if it doesn't exist
    upload_dir = Path("/app/uploads/documents")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}_{file_name}"
    file_path = upload_dir / safe_filename
    
    # Decode and save file
    try:
        file_bytes = base64.b64decode(file_data)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to save file: {str(e)}")
    
    # Create document record
    doc = Document(
        id=doc_id,
        university_id=current_user["university_id"],
        student_id=current_user["id"],
        application_id=application_id,
        name=document_name,
        file_name=file_name,
        file_url=f"/uploads/documents/{safe_filename}",
        file_type=ext,
        file_size=file_size,
        status=DocumentStatus.UPLOADED
    )
    
    await db.documents.insert_one(doc.model_dump())
    
    return {"message": "Document uploaded successfully", "document_id": doc_id}


@document_router.get("/application/{application_id}")
async def get_application_documents(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all documents for an application"""
    # Verify access
    application = await db.applications.find_one({"id": application_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Students can only access their own documents
    if current_user["role"] == "student" and application["student_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Staff can access documents from their university
    if current_user["role"] in ["university_admin", "counselling_manager", "counsellor"]:
        if application["university_id"] != current_user.get("university_id"):
            raise HTTPException(status_code=403, detail="Access denied")
    
    documents = await db.documents.find(
        {"application_id": application_id},
        {"_id": 0}
    ).to_list(100)
    
    return {"data": [serialize_doc(d) for d in documents]}


@document_router.get("/my-documents")
async def get_my_documents(current_user: dict = Depends(require_roles(UserRole.STUDENT))):
    """Get student's own documents across all applications"""
    # Get student's applications
    applications = await db.applications.find(
        {"student_id": current_user["id"]},
        {"id": 1}
    ).to_list(100)
    
    app_ids = [a["id"] for a in applications]
    
    documents = await db.documents.find(
        {"application_id": {"$in": app_ids}},
        {"_id": 0}
    ).to_list(100)
    
    return {"data": [serialize_doc(d) for d in documents]}


@document_router.put("/{document_id}/verify")
async def verify_document(
    document_id: str,
    status: DocumentStatus = Body(...),
    rejection_reason: Optional[str] = Body(None),
    current_user: dict = Depends(require_roles(UserRole.UNIVERSITY_ADMIN, UserRole.COUNSELLING_MANAGER))
):
    """Verify or reject a document"""
    doc = await db.documents.find_one({"id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc["university_id"] != current_user.get("university_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {
        "status": status.value,
        "verified_by": current_user["id"],
        "verified_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    if status == DocumentStatus.REJECTED and rejection_reason:
        update_data["rejection_reason"] = rejection_reason
    
    await db.documents.update_one(
        {"id": document_id},
        {"$set": update_data}
    )
    
    return {"message": f"Document {status.value}"}


@document_router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Delete a document (students can only delete their own unverified documents)"""
    doc = await db.documents.find_one({"id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc["student_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if doc["status"] == "verified":
        raise HTTPException(status_code=400, detail="Cannot delete verified documents")
    
    # Delete file
    try:
        file_path = Path(f"/app{doc['file_url']}")
        if file_path.exists():
            file_path.unlink()
    except Exception:
        pass
    
    await db.documents.delete_one({"id": document_id})
    
    return {"message": "Document deleted"}


# ============== COUNSELLING MANAGER ROUTES ==============

@api_router.get("/counselling/dashboard")
async def counselling_manager_dashboard(
    current_user: dict = Depends(require_roles(UserRole.COUNSELLING_MANAGER))
):
    """Get counselling manager dashboard"""
    university_id = current_user["university_id"]
    
    # Get counsellors
    counsellors = await db.users.find({
        "university_id": university_id,
        "role": "counsellor"
    }, {"_id": 0, "id": 1, "name": 1}).to_list(100)
    
    # Get lead counts by counsellor
    pipeline = [
        {"$match": {"university_id": university_id}},
        {"$group": {"_id": "$assigned_to", "count": {"$sum": 1}}}
    ]
    leads_by_counsellor = await db.leads.aggregate(pipeline).to_list(100)
    leads_map = {item["_id"]: item["count"] for item in leads_by_counsellor}
    
    # Pending follow-ups
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    pipeline = [
        {"$match": {"university_id": university_id}},
        {"$unwind": "$follow_ups"},
        {"$match": {
            "follow_ups.is_completed": False,
            "follow_ups.scheduled_at": {"$lte": today.isoformat()}
        }},
        {"$group": {"_id": "$assigned_to", "overdue_count": {"$sum": 1}}}
    ]
    overdue_by_counsellor = await db.leads.aggregate(pipeline).to_list(100)
    overdue_map = {item["_id"]: item["overdue_count"] for item in overdue_by_counsellor}
    
    # Build counsellor stats
    counsellor_stats = []
    for c in counsellors:
        counsellor_stats.append({
            "id": c["id"],
            "name": c["name"],
            "total_leads": leads_map.get(c["id"], 0),
            "overdue_follow_ups": overdue_map.get(c["id"], 0)
        })
    
    # Unassigned leads
    unassigned = await db.leads.count_documents({
        "university_id": university_id,
        "assigned_to": None
    })
    
    return {
        "counsellor_stats": counsellor_stats,
        "unassigned_leads": unassigned,
        "total_counsellors": len(counsellors)
    }


@api_router.get("/counselling/lead-analytics")
async def get_lead_analytics(
    current_user: dict = Depends(require_roles(UserRole.COUNSELLING_MANAGER, UserRole.UNIVERSITY_ADMIN))
):
    """Get lead source analytics and stage distribution"""
    university_id = current_user["university_id"]
    
    # Leads by source
    pipeline = [
        {"$match": {"university_id": university_id}},
        {"$group": {"_id": "$source", "count": {"$sum": 1}}}
    ]
    leads_by_source = await db.leads.aggregate(pipeline).to_list(20)
    
    # Leads by stage
    pipeline = [
        {"$match": {"university_id": university_id}},
        {"$group": {"_id": "$stage", "count": {"$sum": 1}}}
    ]
    leads_by_stage = await db.leads.aggregate(pipeline).to_list(20)
    
    # Conversion funnel
    total = await db.leads.count_documents({"university_id": university_id})
    contacted = await db.leads.count_documents({
        "university_id": university_id,
        "stage": {"$nin": ["new_lead"]}
    })
    interested = await db.leads.count_documents({
        "university_id": university_id,
        "stage": {"$in": ["interested", "follow_up_scheduled", "application_started", 
                         "documents_pending", "documents_submitted", "fee_pending", 
                         "fee_paid", "admission_confirmed"]}
    })
    applied = await db.leads.count_documents({
        "university_id": university_id,
        "stage": {"$in": ["application_started", "documents_pending", "documents_submitted",
                         "fee_pending", "fee_paid", "admission_confirmed"]}
    })
    converted = await db.leads.count_documents({
        "university_id": university_id,
        "stage": {"$in": ["admission_confirmed", "fee_paid"]}
    })
    
    # Leads over time (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    pipeline = [
        {"$match": {
            "university_id": university_id,
            "created_at": {"$gte": thirty_days_ago}
        }},
        {"$project": {
            "date": {"$substr": ["$created_at", 0, 10]},
            "source": 1
        }},
        {"$group": {
            "_id": "$date",
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    leads_over_time = await db.leads.aggregate(pipeline).to_list(31)
    
    return {
        "by_source": [{"source": item["_id"] or "unknown", "count": item["count"]} for item in leads_by_source],
        "by_stage": [{"stage": item["_id"] or "unknown", "count": item["count"]} for item in leads_by_stage],
        "funnel": {
            "total": total,
            "contacted": contacted,
            "interested": interested,
            "applied": applied,
            "converted": converted
        },
        "over_time": [{"date": item["_id"], "count": item["count"]} for item in leads_over_time]
    }


# ============== COUNSELLOR ROUTES ==============

@api_router.get("/counsellor/dashboard")
async def counsellor_dashboard(
    current_user: dict = Depends(require_roles(UserRole.COUNSELLOR))
):
    """Get counsellor's personal dashboard"""
    user_id = current_user["id"]
    university_id = current_user["university_id"]
    
    # Total leads assigned to this counsellor
    total_leads = await db.leads.count_documents({
        "university_id": university_id,
        "assigned_to": user_id
    })
    
    # New leads (stage = new_lead)
    new_leads = await db.leads.count_documents({
        "university_id": university_id,
        "assigned_to": user_id,
        "stage": "new_lead"
    })
    
    # Converted leads
    converted_leads = await db.leads.count_documents({
        "university_id": university_id,
        "assigned_to": user_id,
        "stage": {"$in": ["converted", "admission_confirmed"]}
    })
    
    # Overdue follow-ups
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    pipeline = [
        {"$match": {"university_id": university_id, "assigned_to": user_id}},
        {"$unwind": "$follow_ups"},
        {"$match": {
            "follow_ups.is_completed": False,
            "follow_ups.scheduled_at": {"$lt": today.isoformat()}
        }},
        {"$count": "overdue"}
    ]
    overdue_result = await db.leads.aggregate(pipeline).to_list(1)
    overdue_follow_ups = overdue_result[0]["overdue"] if overdue_result else 0
    
    # Recent leads
    recent_leads = await db.leads.find(
        {"university_id": university_id, "assigned_to": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Today's follow-ups
    tomorrow = today + timedelta(days=1)
    pipeline = [
        {"$match": {"university_id": university_id, "assigned_to": user_id}},
        {"$unwind": "$follow_ups"},
        {"$match": {
            "follow_ups.is_completed": False,
            "follow_ups.scheduled_at": {
                "$gte": today.isoformat(),
                "$lt": tomorrow.isoformat()
            }
        }},
        {"$project": {
            "lead_id": "$id",
            "lead_name": "$name",
            "type": "$follow_ups.follow_up_type",
            "notes": "$follow_ups.notes",
            "scheduled_at": "$follow_ups.scheduled_at"
        }},
        {"$limit": 10}
    ]
    today_follow_ups = await db.leads.aggregate(pipeline).to_list(10)
    
    return {
        "total_leads": total_leads,
        "new_leads": new_leads,
        "converted_leads": converted_leads,
        "overdue_follow_ups": overdue_follow_ups,
        "recent_leads": [serialize_doc(l) for l in recent_leads],
        "today_follow_ups": today_follow_ups
    }


# ============== WEBHOOK ROUTES ==============

@api_router.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhooks"""
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    
    # Verify signature
    if RAZORPAY_WEBHOOK_SECRET:
        expected = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected):
            raise HTTPException(status_code=400, detail="Invalid signature")
    
    payload = await request.json()
    event = payload.get("event")
    
    if event == "payment.captured":
        payment_data = payload.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payment_data.get("order_id")
        
        await db.payments.update_one(
            {"razorpay_order_id": order_id},
            {
                "$set": {
                    "status": "success",
                    "razorpay_payment_id": payment_data.get("id"),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    
    elif event == "payment.failed":
        payment_data = payload.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payment_data.get("order_id")
        
        await db.payments.update_one(
            {"razorpay_order_id": order_id},
            {
                "$set": {
                    "status": "failed",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    
    elif event == "transfer.processed":
        transfer_data = payload.get("payload", {}).get("transfer", {}).get("entity", {})
        payment_id = transfer_data.get("source")
        
        await db.payments.update_one(
            {"razorpay_payment_id": payment_id},
            {
                "$set": {
                    "transfer_id": transfer_data.get("id"),
                    "transfer_status": "success",
                    "transfer_amount": transfer_data.get("amount", 0) / 100,
                    "transferred_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    
    return {"status": "ok"}


# ============== PUBLIC ROUTES ==============

@api_router.get("/public/universities")
async def list_public_universities():
    """Get list of active universities for login dropdown"""
    universities = await db.universities.find(
        {"is_active": True},
        {"_id": 0, "id": 1, "name": 1, "code": 1}
    ).to_list(1000)
    return {"data": [serialize_doc(u) for u in universities]}


@api_router.get("/")
async def root():
    return {"message": "UNIFY API v1.0.0", "status": "running"}


@api_router.get("/health")
async def health():
    return {"status": "healthy"}


# ============== EMAIL ROUTES ==============

@email_router.post("/test")
async def send_test_email(
    to_email: str = Body(...),
    to_name: str = Body(...),
    current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN))
):
    """Send a test email (Super Admin only)"""
    result = await email_service.send_email(
        to_email=to_email,
        to_name=to_name,
        subject="UNIFY Test Email",
        html_content="""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #667eea;">UNIFY Email Test</h2>
            <p>Hi {name},</p>
            <p>This is a test email from the UNIFY platform to verify that email notifications are working correctly.</p>
            <p>If you received this email, the Brevo integration is configured properly! ✓</p>
            <p>Best regards,<br>UNIFY Platform</p>
        </body>
        </html>
        """.format(name=to_name)
    )
    
    if result.get("success"):
        # Log the email
        email_log = EmailLog(
            to_email=to_email,
            to_name=to_name,
            subject="UNIFY Test Email",
            email_type=EmailType.USER_CREDENTIALS,
            status=EmailStatus.SENT,
            brevo_message_id=result.get("message_id")
        )
        await db.email_logs.insert_one(email_log.model_dump())
        return {"message": "Test email sent successfully", "message_id": result.get("message_id")}
    else:
        return {"message": "Failed to send test email", "error": result.get("error")}


@email_router.get("/logs")
async def get_email_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    email_type: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN))
):
    """Get email logs"""
    query = {}
    
    # Filter by university for non-super admins
    if current_user["role"] != "super_admin":
        query["university_id"] = current_user["university_id"]
    
    if email_type:
        query["email_type"] = email_type
    if status:
        query["status"] = status
    
    total = await db.email_logs.count_documents(query)
    logs = await db.email_logs.find(query, {"_id": 0}).sort("created_at", -1).skip((page - 1) * limit).limit(limit).to_list(limit)
    
    return {
        "data": [serialize_doc(log) for log in logs],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@email_router.get("/stats")
async def get_email_stats(
    current_user: dict = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN))
):
    """Get email statistics"""
    query = {}
    if current_user["role"] != "super_admin":
        query["university_id"] = current_user["university_id"]
    
    # Count by status
    pipeline = [
        {"$match": query},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_counts = await db.email_logs.aggregate(pipeline).to_list(10)
    
    # Count by type
    pipeline = [
        {"$match": query},
        {"$group": {"_id": "$email_type", "count": {"$sum": 1}}}
    ]
    type_counts = await db.email_logs.aggregate(pipeline).to_list(20)
    
    return {
        "by_status": {item["_id"]: item["count"] for item in status_counts},
        "by_type": {item["_id"]: item["count"] for item in type_counts},
        "total": sum(item["count"] for item in status_counts)
    }


# ============== STUDENT QUERY ROUTES ==============

# ============== STUDENT QUERY ROUTES ==============

@query_router.post("")
async def create_query(
    query_data: QueryCreate,
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Create a new query from student"""
    # Get student's lead to find assigned counsellor
    lead = await db.leads.find_one({
        "email": current_user.get("email"),
        "university_id": current_user["university_id"]
    })
    
    counsellor_id = lead.get("assigned_to") if lead else None
    counsellor_name = lead.get("assigned_to_name") if lead else None
    
    query = StudentQuery(
        university_id=current_user["university_id"],
        student_id=current_user["id"],
        student_name=current_user["name"],
        student_email=current_user.get("email", ""),
        counsellor_id=counsellor_id,
        counsellor_name=counsellor_name,
        subject=query_data.subject,
        messages=[QueryMessage(
            sender_id=current_user["id"],
            sender_name=current_user["name"],
            sender_role="student",
            content=query_data.message
        )]
    )
    
    await db.queries.insert_one(query.model_dump())
    return serialize_doc(query.model_dump())


@query_router.get("/my-queries")
async def get_my_queries(
    status: Optional[str] = None,
    current_user: dict = Depends(require_roles(UserRole.STUDENT))
):
    """Get student's own queries"""
    query = {"student_id": current_user["id"]}
    if status:
        query["status"] = status
    
    queries = await db.queries.find(query, {"_id": 0}).sort("updated_at", -1).to_list(100)
    return {"data": [serialize_doc(q) for q in queries]}


@query_router.get("/counsellor-queries")
async def get_counsellor_queries(
    status: Optional[str] = None,
    current_user: dict = Depends(require_roles(UserRole.COUNSELLOR, UserRole.COUNSELLING_MANAGER))
):
    """Get queries assigned to counsellor"""
    query = {
        "university_id": current_user["university_id"],
        "counsellor_id": current_user["id"]
    }
    if status:
        query["status"] = status
    
    queries = await db.queries.find(query, {"_id": 0}).sort("updated_at", -1).to_list(100)
    return {"data": [serialize_doc(q) for q in queries]}


@query_router.get("/all")
async def get_all_queries(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_roles(UserRole.COUNSELLING_MANAGER, UserRole.UNIVERSITY_ADMIN))
):
    """Get all queries for university (managers/admins)"""
    query = {"university_id": current_user["university_id"]}
    if status:
        query["status"] = status
    
    total = await db.queries.count_documents(query)
    queries = await db.queries.find(query, {"_id": 0}).sort("updated_at", -1).skip((page - 1) * limit).limit(limit).to_list(limit)
    
    return {
        "data": [serialize_doc(q) for q in queries],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


# ✅ IMPORTANT: stats route MUST be BEFORE "/{query_id}" route
@query_router.get("/stats/summary")
async def get_query_stats(
    current_user: dict = Depends(require_roles(UserRole.COUNSELLOR, UserRole.COUNSELLING_MANAGER, UserRole.UNIVERSITY_ADMIN))
):
    """Get query statistics"""
    query = {"university_id": current_user["university_id"]}
    
    if current_user["role"] == "counsellor":
        query["counsellor_id"] = current_user["id"]
    
    pipeline = [
        {"$match": query},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_counts = await db.queries.aggregate(pipeline).to_list(10)
    
    total = sum(item["count"] for item in status_counts)
    pending = next((item["count"] for item in status_counts if item["_id"] == "pending"), 0)
    replied = next((item["count"] for item in status_counts if item["_id"] == "replied"), 0)
    closed = next((item["count"] for item in status_counts if item["_id"] == "closed"), 0)
    
    return {
        "total": total,
        "pending": pending,
        "replied": replied,
        "closed": closed
    }


@query_router.get("/{query_id}")
async def get_query(
    query_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific query"""
    query = await db.queries.find_one({"id": query_id}, {"_id": 0})
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    # Check access
    if current_user["role"] == "student":
        if query["student_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user["role"] in ["counsellor", "counselling_manager"]:
        if query["university_id"] != current_user["university_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return serialize_doc(query)


@query_router.post("/{query_id}/reply")
async def reply_to_query(
    query_id: str,
    reply_data: QueryReply,
    current_user: dict = Depends(get_current_user)
):
    """Reply to a query"""
    query = await db.queries.find_one({"id": query_id})
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    # Check access
    if current_user["role"] == "student":
        if query["student_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user["role"] in ["counsellor", "counselling_manager"]:
        if query["university_id"] != current_user["university_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Create new message
    message = QueryMessage(
        sender_id=current_user["id"],
        sender_name=current_user["name"],
        sender_role=current_user["role"],
        content=reply_data.message
    )
    
    # Update status based on who replied
    new_status = "replied" if current_user["role"] in ["counsellor", "counselling_manager"] else "pending"
    
    # Update counsellor if not set
    update_data = {
        "$push": {"messages": message.model_dump()},
        "$set": {
            "status": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    }
    
    # If counsellor replies and no counsellor assigned, assign them
    if current_user["role"] in ["counsellor", "counselling_manager"] and not query.get("counsellor_id"):
        update_data["$set"]["counsellor_id"] = current_user["id"]
        update_data["$set"]["counsellor_name"] = current_user["name"]
    
    await db.queries.update_one({"id": query_id}, update_data)
    
    updated_query = await db.queries.find_one({"id": query_id}, {"_id": 0})
    return serialize_doc(updated_query)


@query_router.put("/{query_id}/status")
async def update_query_status(
    query_id: str,
    status_data: QueryUpdate,
    current_user: dict = Depends(require_roles(UserRole.COUNSELLOR, UserRole.COUNSELLING_MANAGER))
):
    """Update query status (close query)"""
    query = await db.queries.find_one({"id": query_id, "university_id": current_user["university_id"]})
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    update_data = {
        "status": status_data.status.value,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if status_data.status == QueryStatus.CLOSED:
        update_data["closed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.queries.update_one({"id": query_id}, {"$set": update_data})
    
    updated_query = await db.queries.find_one({"id": query_id}, {"_id": 0})
    return serialize_doc(updated_query)


@query_router.get("/stats/summary")
async def get_query_stats(
    current_user: dict = Depends(require_roles(UserRole.COUNSELLOR, UserRole.COUNSELLING_MANAGER, UserRole.UNIVERSITY_ADMIN))
):
    """Get query statistics"""
    query = {"university_id": current_user["university_id"]}
    
    if current_user["role"] == "counsellor":
        query["counsellor_id"] = current_user["id"]
    
    pipeline = [
        {"$match": query},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_counts = await db.queries.aggregate(pipeline).to_list(10)
    
    total = sum(item["count"] for item in status_counts)
    pending = next((item["count"] for item in status_counts if item["_id"] == "pending"), 0)
    replied = next((item["count"] for item in status_counts if item["_id"] == "replied"), 0)
    closed = next((item["count"] for item in status_counts if item["_id"] == "closed"), 0)
    
    return {
        "total": total,
        "pending": pending,
        "replied": replied,
        "closed": closed
    }


# Include all routers
api_router.include_router(auth_router)
api_router.include_router(superadmin_router)
api_router.include_router(university_router)
api_router.include_router(lead_router)
api_router.include_router(application_router)
api_router.include_router(payment_router)
api_router.include_router(test_router)
api_router.include_router(student_router)
api_router.include_router(document_router)
api_router.include_router(email_router)
api_router.include_router(query_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
