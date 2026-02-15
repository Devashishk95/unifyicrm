from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
import uuid


class QueryStatus(str, Enum):
    PENDING = "pending"
    REPLIED = "replied"
    CLOSED = "closed"


class QueryMessage(BaseModel):
    """Individual message in a query thread"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    sender_name: str
    sender_role: str  # student or counsellor
    content: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class StudentQuery(BaseModel):
    """Student query to counsellor"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    student_id: str
    student_name: str
    student_email: str
    counsellor_id: Optional[str] = None
    counsellor_name: Optional[str] = None
    
    subject: str
    status: QueryStatus = QueryStatus.PENDING
    messages: List[QueryMessage] = []
    
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    closed_at: Optional[str] = None


class QueryCreate(BaseModel):
    """Create new query"""
    subject: str
    message: str


class QueryReply(BaseModel):
    """Reply to query"""
    message: str


class QueryUpdate(BaseModel):
    """Update query status"""
    status: QueryStatus
