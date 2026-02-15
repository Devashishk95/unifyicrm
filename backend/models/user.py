from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
import uuid


class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    UNIVERSITY_ADMIN = "university_admin"
    COUNSELLING_MANAGER = "counselling_manager"
    COUNSELLOR = "counsellor"
    STUDENT = "student"


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: UserRole
    university_id: Optional[str] = None  # None for super_admin
    person_id: Optional[str] = None  # Unique within university for staff
    phone: Optional[str] = None
    is_active: bool = True
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: UserRole
    university_id: Optional[str] = None
    person_id: Optional[str] = None
    phone: Optional[str] = None
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class UserLogin(BaseModel):
    university_id: Optional[str] = None  # Required for university staff
    role: Optional[UserRole] = None  # Required for university staff
    person_id: Optional[str] = None  # Required for university staff
    email: Optional[EmailStr] = None  # For super admin and students
    password: str


class StudentLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
