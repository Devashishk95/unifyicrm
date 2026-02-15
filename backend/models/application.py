from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


class ApplicationStatus(str, Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    DOCUMENTS_PENDING = "documents_pending"
    DOCUMENTS_SUBMITTED = "documents_submitted"
    TEST_PENDING = "test_pending"
    TEST_COMPLETED = "test_completed"
    PAYMENT_PENDING = "payment_pending"
    PAYMENT_COMPLETED = "payment_completed"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ADMITTED = "admitted"
    REJECTED = "rejected"


class ApplicationStep(str, Enum):
    BASIC_INFO = "basic_info"
    EDUCATIONAL_DETAILS = "educational_details"
    DOCUMENTS = "documents"
    ENTRANCE_TEST = "entrance_test"
    PAYMENT = "payment"
    FINAL_SUBMISSION = "final_submission"


class EducationalDetail(BaseModel):
    qualification: Optional[str] = None
    board_university: Optional[str] = None
    passing_year: Optional[int] = None
    marks_percentage: Optional[float] = None
    grade: Optional[str] = None


class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    student_id: str
    lead_id: Optional[str] = None
    
    # Application Number (human readable)
    application_number: str = Field(default_factory=lambda: f"APP-{uuid.uuid4().hex[:8].upper()}")
    
    # Course Selection
    course_id: Optional[str] = None
    department_id: Optional[str] = None
    session_id: Optional[str] = None
    
    # Status Tracking
    status: ApplicationStatus = ApplicationStatus.DRAFT
    current_step: ApplicationStep = ApplicationStep.BASIC_INFO
    completed_steps: List[ApplicationStep] = []
    
    # Basic Info (Step 1)
    basic_info: Dict[str, Any] = {}
    
    # Educational Details (Step 2)
    educational_details: List[EducationalDetail] = []
    
    # Documents (Step 3)
    documents: List[str] = []  # Document IDs
    
    # Test (Step 4)
    test_attempt_id: Optional[str] = None
    test_score: Optional[float] = None
    test_passed: Optional[bool] = None
    
    # Payment (Step 5)
    payment_id: Optional[str] = None
    fee_amount: Optional[float] = None
    payment_status: Optional[str] = None
    
    # Final Submission (Step 6)
    submitted_at: Optional[datetime] = None
    
    # Review
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ApplicationCreate(BaseModel):
    course_id: Optional[str] = None
    department_id: Optional[str] = None
    session_id: Optional[str] = None


class ApplicationBasicInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None


class ApplicationEducationalDetails(BaseModel):
    qualification: str
    board_university: str
    passing_year: int
    marks_percentage: float
    grade: Optional[str] = None


class ApplicationCourseSelection(BaseModel):
    course_id: str
    department_id: Optional[str] = None
    session_id: Optional[str] = None
