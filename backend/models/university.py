from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


class PaymentStage(str, Enum):
    AFTER_APPLICATION = "after_application"
    AFTER_DOCUMENTS = "after_documents"
    AFTER_TEST = "after_test"


class DocumentRequirement(BaseModel):
    name: str
    is_mandatory: bool = True
    allowed_types: List[str] = ["pdf", "jpg", "jpeg", "png"]
    max_size_mb: int = 5


class TestEligibility(str, Enum):
    AFTER_REGISTRATION = "after_registration"
    AFTER_DOCUMENTS = "after_documents"
    AFTER_PAYMENT = "after_payment"


class RegistrationStep(BaseModel):
    step_number: int
    step_name: str
    is_enabled: bool = True
    config: Dict[str, Any] = {}


class RegistrationConfig(BaseModel):
    # Step 1: Basic Info (always enabled)
    basic_info_enabled: bool = True
    
    # Step 2: Educational Details
    educational_details_enabled: bool = True
    educational_fields: List[str] = ["qualification", "board", "passing_year", "marks", "course"]
    
    # Step 3: Document Upload
    documents_enabled: bool = True
    required_documents: List[DocumentRequirement] = []
    
    # Step 4: Entrance Test
    entrance_test_enabled: bool = False
    test_eligibility: TestEligibility = TestEligibility.AFTER_REGISTRATION
    
    # Step 5: Registration Fee
    fee_enabled: bool = False
    fee_amount: float = 0
    fee_by_course: Dict[str, float] = {}  # course_id -> amount
    payment_stage: PaymentStage = PaymentStage.AFTER_APPLICATION
    refund_allowed: bool = False
    
    # Step 6: Final Submission (always enabled)
    final_submission_enabled: bool = True


class RazorpayConfig(BaseModel):
    linked_account_id: Optional[str] = None
    account_status: str = "pending"  # pending, active, suspended
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    kyc_status: str = "pending"  # pending, submitted, verified, rejected


class University(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str  # Unique university code for login
    email: EmailStr
    phone: str
    address: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    
    # Subscription
    subscription_plan: str = "basic"
    subscription_status: str = "active"  # active, expired, suspended
    subscription_start: Optional[datetime] = None
    subscription_end: Optional[datetime] = None
    
    # Registration Configuration
    registration_config: RegistrationConfig = Field(default_factory=RegistrationConfig)
    
    # Razorpay Integration
    razorpay_config: RazorpayConfig = Field(default_factory=RazorpayConfig)
    
    # CMS Content
    about: Optional[str] = None
    facilities: List[str] = []
    gallery: List[str] = []  # Image URLs
    brochures: List[Dict[str, str]] = []  # {name, url}
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UniversityCreate(BaseModel):
    name: str
    code: str
    email: EmailStr
    phone: str
    address: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    subscription_plan: str = "basic"


class UniversityUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None
    is_active: Optional[bool] = None
    about: Optional[str] = None
    facilities: Optional[List[str]] = None
    gallery: Optional[List[str]] = None
    brochures: Optional[List[Dict[str, str]]] = None


class RegistrationConfigUpdate(BaseModel):
    educational_details_enabled: Optional[bool] = None
    educational_fields: Optional[List[str]] = None
    documents_enabled: Optional[bool] = None
    required_documents: Optional[List[DocumentRequirement]] = None
    entrance_test_enabled: Optional[bool] = None
    test_eligibility: Optional[TestEligibility] = None
    fee_enabled: Optional[bool] = None
    fee_amount: Optional[float] = None
    fee_by_course: Optional[Dict[str, float]] = None
    payment_stage: Optional[PaymentStage] = None
    refund_allowed: Optional[bool] = None
