from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


class QuestionType(str, Enum):
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"


class Question(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    
    # Question Details
    question_text: str
    question_type: QuestionType = QuestionType.SINGLE_CHOICE
    options: List[str]
    correct_options: List[int]  # Indices of correct options
    marks: float = 1.0
    negative_marks: float = 0.0
    
    # Categorization
    department_id: Optional[str] = None
    course_id: Optional[str] = None
    subject: Optional[str] = None
    difficulty: str = "medium"  # easy, medium, hard
    tags: List[str] = []
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class QuestionCreate(BaseModel):
    question_text: str
    question_type: QuestionType = QuestionType.SINGLE_CHOICE
    options: List[str]
    correct_options: List[int]
    marks: float = 1.0
    negative_marks: float = 0.0
    department_id: Optional[str] = None
    course_id: Optional[str] = None
    subject: Optional[str] = None
    difficulty: str = "medium"
    tags: List[str] = []


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    options: Optional[List[str]] = None
    correct_options: Optional[List[int]] = None
    marks: Optional[float] = None
    negative_marks: Optional[float] = None
    subject: Optional[str] = None
    difficulty: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class QuestionBank(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    name: str
    description: Optional[str] = None
    department_id: Optional[str] = None
    course_id: Optional[str] = None
    question_ids: List[str] = []
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TestConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    
    name: str
    description: Optional[str] = None
    
    # Test Rules
    duration_minutes: int = 60
    total_questions: int = 50
    total_marks: float = 50
    passing_marks: float = 20
    negative_marking: bool = False
    
    # Question Selection
    question_bank_ids: List[str] = []
    randomize_questions: bool = True
    randomize_options: bool = False
    
    # Applicability
    department_id: Optional[str] = None
    course_id: Optional[str] = None
    
    # Instructions
    instructions: List[str] = []
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TestConfigCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int = 60
    total_questions: int = 50
    total_marks: float = 50
    passing_marks: float = 20
    negative_marking: bool = False
    question_bank_ids: List[str] = []
    randomize_questions: bool = True
    randomize_options: bool = False
    department_id: Optional[str] = None
    course_id: Optional[str] = None
    instructions: List[str] = []


class TestAttempt(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    university_id: str
    student_id: str
    application_id: str
    test_config_id: str
    
    # Questions served to this student
    questions: List[Dict[str, Any]] = []  # Shuffled questions without answers
    
    # Student Responses
    responses: Dict[str, List[int]] = {}  # question_id -> selected option indices
    
    # Timing
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    time_remaining_seconds: Optional[int] = None
    
    # Status
    status: str = "not_started"  # not_started, in_progress, submitted, evaluated
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TestAnswer(BaseModel):
    question_id: str
    selected_options: List[int]


class TestSubmit(BaseModel):
    responses: Dict[str, List[int]]  # question_id -> selected option indices


class TestResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    attempt_id: str
    student_id: str
    application_id: str
    
    # Scores
    total_questions: int
    attempted: int
    correct: int
    incorrect: int
    unanswered: int
    
    marks_obtained: float
    total_marks: float
    percentage: float
    
    # Result
    passed: bool
    passing_marks: float
    
    # Details
    question_results: List[Dict[str, Any]] = []  # Detailed per-question results
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
