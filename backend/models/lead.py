from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


class LeadStage(str, Enum):
    NEW_LEAD = "new_lead"
    CONTACTED = "contacted"
    INTERESTED = "interested"
    NOT_INTERESTED = "not_interested"
    FOLLOW_UP_SCHEDULED = "follow_up_scheduled"
    APPLICATION_STARTED = "application_started"
    DOCUMENTS_PENDING = "documents_pending"
    DOCUMENTS_SUBMITTED = "documents_submitted"
    FEE_PENDING = "fee_pending"
    FEE_PAID = "fee_paid"
    ADMISSION_CONFIRMED = "admission_confirmed"
    CLOSED_LOST = "closed_lost"


class LeadSource(str, Enum):
    MANUAL = "manual"
    WEBSITE = "website"
    SHIKSHA = "shiksha"
    COLLEGEDUNIA = "collegedunia"
    OTHER_API = "other_api"


class TimelineEventType(str, Enum):
    CREATED = "created"
    ASSIGNED = "assigned"
    REASSIGNED = "reassigned"
    STATUS_CHANGED = "status_changed"
    NOTE_ADDED = "note_added"
    FOLLOW_UP_SET = "follow_up_set"
    FOLLOW_UP_COMPLETED = "follow_up_completed"
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_VERIFIED = "document_verified"
    PAYMENT_INITIATED = "payment_initiated"
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_FAILED = "payment_failed"
    REFUND_INITIATED = "refund_initiated"
    REFUND_COMPLETED = "refund_completed"
    TEST_STARTED = "test_started"
    TEST_COMPLETED = "test_completed"
    ADMISSION_CONFIRMED = "admission_confirmed"
    CLOSED = "closed"
    CHAT_MESSAGE = "chat_message"


class TimelineEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: TimelineEventType
    description: str
    metadata: Dict[str, Any] = {}
    created_by: Optional[str] = None  # User ID
    created_by_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FollowUp(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    scheduled_at: datetime
    notes: Optional[str] = None
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Note(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    created_by: str
    created_by_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    
    # Basic Info
    name: str
    email: EmailStr
    phone: str
    
    # Lead Details
    source: LeadSource = LeadSource.MANUAL
    source_details: Optional[str] = None  # e.g., campaign name
    stage: LeadStage = LeadStage.NEW_LEAD
    
    # Course Interest
    interested_course_id: Optional[str] = None
    interested_department_id: Optional[str] = None
    
    # Assignment
    assigned_to: Optional[str] = None  # Counsellor user ID
    assigned_to_name: Optional[str] = None
    assigned_at: Optional[datetime] = None
    
    # Application Reference
    application_id: Optional[str] = None
    
    # Follow-ups
    follow_ups: List[FollowUp] = []
    next_follow_up: Optional[datetime] = None
    
    # Notes
    notes: List[Note] = []
    
    # Timeline (immutable log)
    timeline: List[TimelineEntry] = []
    
    # Metadata
    tags: List[str] = []
    custom_fields: Dict[str, Any] = {}
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    source: LeadSource = LeadSource.MANUAL
    source_details: Optional[str] = None
    interested_course_id: Optional[str] = None
    interested_department_id: Optional[str] = None
    tags: List[str] = []
    custom_fields: Dict[str, Any] = {}


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    stage: Optional[LeadStage] = None
    interested_course_id: Optional[str] = None
    interested_department_id: Optional[str] = None
    tags: Optional[List[str]] = None
    custom_fields: Optional[Dict[str, Any]] = None


class LeadAssignment(BaseModel):
    lead_ids: List[str]
    counsellor_id: str


class LeadNote(BaseModel):
    content: str


class LeadFollowUp(BaseModel):
    scheduled_at: datetime
    notes: Optional[str] = None


class LeadStageUpdate(BaseModel):
    stage: LeadStage
    notes: Optional[str] = None


class LeadBulkReassign(BaseModel):
    lead_ids: List[str]
    from_counsellor_id: Optional[str] = None
    to_counsellor_id: str
    reason: Optional[str] = None
