from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
import uuid


class DocumentStatus(str, Enum):
    UPLOADED = "uploaded"
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    REJECTED = "rejected"


class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    student_id: str
    application_id: str
    
    # Document Info
    name: str  # e.g., "10th Marksheet"
    file_name: str
    file_url: str
    file_type: str  # pdf, jpg, png
    file_size: int  # in bytes
    
    # Verification
    status: DocumentStatus = DocumentStatus.UPLOADED
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DocumentConfig(BaseModel):
    name: str
    is_mandatory: bool = True
    allowed_types: List[str] = ["pdf", "jpg", "jpeg", "png"]
    max_size_mb: int = 5
    description: Optional[str] = None


class DocumentUpload(BaseModel):
    name: str
    file_name: str
    file_type: str
    file_size: int
    # file_url will be generated after upload


class DocumentVerification(BaseModel):
    document_id: str
    status: DocumentStatus
    rejection_reason: Optional[str] = None
