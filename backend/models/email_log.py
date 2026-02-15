from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


class EmailType(str, Enum):
    USER_CREDENTIALS = "user_credentials"
    STUDENT_REGISTRATION = "student_registration"
    LEAD_ASSIGNMENT = "lead_assignment"
    FOLLOW_UP_REMINDER = "follow_up_reminder"
    PAYMENT_RECEIPT = "payment_receipt"
    REFUND_NOTIFICATION = "refund_notification"
    TEST_RESULT = "test_result"
    PASSWORD_RESET = "password_reset"
    APPLICATION_STATUS = "application_status"


class EmailStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    BOUNCED = "bounced"


class EmailLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Email Details
    to_email: EmailStr
    to_name: Optional[str] = None
    subject: str
    email_type: EmailType
    
    # Brevo Details
    brevo_message_id: Optional[str] = None
    template_id: Optional[int] = None
    
    # Status
    status: EmailStatus = EmailStatus.PENDING
    error_message: Optional[str] = None
    
    # Context
    university_id: Optional[str] = None
    user_id: Optional[str] = None
    lead_id: Optional[str] = None
    application_id: Optional[str] = None
    
    # Metadata
    metadata: Dict[str, Any] = {}
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
