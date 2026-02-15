from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


class PaymentStatus(str, Enum):
    INITIATED = "initiated"
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class TransferStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"
    REVERSED = "reversed"


class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    student_id: str
    application_id: str
    
    # Amount Details
    amount: float  # In INR
    currency: str = "INR"
    fee_type: str = "registration"  # registration, admission, etc.
    
    # Razorpay Details
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    
    # Status
    status: PaymentStatus = PaymentStatus.INITIATED
    
    # Transfer to University
    transfer_id: Optional[str] = None
    transfer_status: TransferStatus = TransferStatus.PENDING
    transfer_amount: Optional[float] = None
    transferred_at: Optional[datetime] = None
    
    # Refund Details
    refund_id: Optional[str] = None
    refund_amount: Optional[float] = None
    refund_status: Optional[str] = None
    refund_reason: Optional[str] = None
    refunded_at: Optional[datetime] = None
    refunded_by: Optional[str] = None
    
    # Metadata
    metadata: Dict[str, Any] = {}
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PaymentCreate(BaseModel):
    application_id: str
    amount: float
    fee_type: str = "registration"


class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class Refund(BaseModel):
    payment_id: str
    amount: Optional[float] = None  # None means full refund
    reason: str


class PaymentSummary(BaseModel):
    total_collected: float = 0
    successful_payments: int = 0
    failed_payments: int = 0
    total_refunded: float = 0
    pending_transfers: float = 0
    successful_transfers: float = 0
    failed_transfers: int = 0


class UniversityPaymentStats(BaseModel):
    university_id: str
    university_name: str
    total_collected: float = 0
    successful_payments: int = 0
    failed_payments: int = 0
    total_refunded: float = 0
    transfer_status: Dict[str, int] = {}  # status -> count
    kyc_status: str = "pending"
