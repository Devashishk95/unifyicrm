from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid


class Department(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    name: str
    code: str
    description: Optional[str] = None
    head_name: Optional[str] = None
    contact_email: Optional[str] = None
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    head_name: Optional[str] = None
    contact_email: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    head_name: Optional[str] = None
    contact_email: Optional[str] = None
    is_active: Optional[bool] = None


class Course(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    department_id: str
    
    name: str
    code: str
    description: Optional[str] = None
    duration_years: int = 4
    total_seats: Optional[int] = None
    fee_amount: Optional[float] = None
    
    eligibility_criteria: Optional[str] = None
    syllabus_url: Optional[str] = None
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CourseCreate(BaseModel):
    department_id: str
    name: str
    code: str
    description: Optional[str] = None
    duration_years: int = 4
    total_seats: Optional[int] = None
    fee_amount: Optional[float] = None
    eligibility_criteria: Optional[str] = None
    syllabus_url: Optional[str] = None


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    duration_years: Optional[int] = None
    total_seats: Optional[int] = None
    fee_amount: Optional[float] = None
    eligibility_criteria: Optional[str] = None
    syllabus_url: Optional[str] = None
    is_active: Optional[bool] = None


class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    
    name: str  # e.g., "2024-25"
    start_date: datetime
    end_date: datetime
    
    # Application Period
    application_start: Optional[datetime] = None
    application_end: Optional[datetime] = None
    
    is_current: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SessionCreate(BaseModel):
    name: str
    start_date: datetime
    end_date: datetime
    application_start: Optional[datetime] = None
    application_end: Optional[datetime] = None
    is_current: bool = False


class SessionUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    application_start: Optional[datetime] = None
    application_end: Optional[datetime] = None
    is_current: Optional[bool] = None
    is_active: Optional[bool] = None
