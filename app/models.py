from sqlalchemy import Column, Integer, String, Text, Float, JSON, ForeignKey, Table, DateTime, func
from sqlalchemy.orm import relationship
from .db import Base

role_skill = Table(
    "role_skill",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id")),
    Column("skill_id", Integer, ForeignKey("skills.id"))
)

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    summary = Column(Text)
    body = Column(Text)
    avg_income_low = Column(Integer)
    avg_income_high = Column(Integer)
    working_hours = Column(String)
    lifestyle = Column(String)
    quality_of_life_score = Column(Float)
    tags = Column(JSON)
    traits = Column(JSON, default={})

    skills = relationship("Skill", secondary=role_skill, back_populates="roles")

class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    description = Column(Text)
    roles = relationship("Role", secondary=role_skill, back_populates="skills")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)

    # relationship
    results = relationship("UserResult", back_populates="user")


class UserResult(Base):
    __tablename__ = "user_results"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    answers = Column(JSON)  # raw quiz answers
    recommendations = Column(JSON)  # top recommended roles
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="results")
