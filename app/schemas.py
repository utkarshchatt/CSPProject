from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any

class SkillBase(BaseModel):
    name: str
    description: Optional[str]

class SkillOut(SkillBase):
    id: int
    class Config:
        orm_mode = True

class RoleBase(BaseModel):
    title: str
    slug: str
    summary: Optional[str]
    body: Optional[str]
    avg_income_low: Optional[int]
    avg_income_high: Optional[int]
    working_hours: Optional[str]
    lifestyle: Optional[str]
    tags: Optional[List[str]]
    traits: Optional[Dict[str, int]] = {}

class RoleCreate(RoleBase):
    pass

class RoleOut(RoleBase):
    id: int
    skills: List[SkillOut] = []
    class Config:
        orm_mode = True
        from_attributes = True

class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    pass

class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True
class QuizSubmission(BaseModel):
    answers: Dict[str, int]   # user answers for traits

# ------------------ User Result Schemas ------------------

class UserResultOut(BaseModel):
    id: int
    user_id: int
    answers: Dict[str, int]
    recommendations: List[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True
