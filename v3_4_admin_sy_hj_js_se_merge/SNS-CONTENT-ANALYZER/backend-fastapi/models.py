"""
SQLAlchemy models for FastAPI backend
Matches Spring Boot entity schema for compatibility
"""
from sqlalchemy import Column, BigInteger, String, Text, DateTime, Integer, Boolean
from sqlalchemy.sql import func
from database import Base
from datetime import datetime

class Comment(Base):
    """
    Comment model - matches Spring Boot Comment entity
    Stores YouTube comments and their analysis results
    """
    __tablename__ = "comments"
    
    # Primary key
    comment_id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    # Foreign keys
    user_id = Column(BigInteger, nullable=False)
    post_id = Column(BigInteger, nullable=True)
    
    # Platform and content info
    platform = Column(String(50), nullable=True)  # YOUTUBE, INSTAGRAM, etc.
    content_url = Column(Text, nullable=True)
    
    # Comment metadata
    external_comment_id = Column("external_comment_id", String(200), nullable=False)
    author_name = Column("author_name", String(200), nullable=False)
    author_identifier = Column("author_identifier", String(200), nullable=True)
    comment_text = Column("comment_text", Text, nullable=False)
    commented_at = Column("commented_at", DateTime, nullable=False)
    
    # Engagement metrics
    like_count = Column("like_count", Integer, nullable=False, default=0)
    reply_count = Column("reply_count", Integer, nullable=False, default=0)
    
    # Analysis results
    is_analyzed = Column("is_analyzed", Boolean, nullable=False, default=False)
    is_malicious = Column("is_malicious", Boolean, nullable=False, default=False)
    
    # Additional analysis scores (optional - can be added later)
    toxicity_score = Column("toxicity_score", Integer, nullable=True)
    hate_speech_score = Column("hate_speech_score", Integer, nullable=True)
    profanity_score = Column("profanity_score", Integer, nullable=True)
    threat_score = Column("threat_score", Integer, nullable=True)
    violence_score = Column("violence_score", Integer, nullable=True)
    sexual_score = Column("sexual_score", Integer, nullable=True)
    
    # Management flags
    is_hidden = Column("is_hidden", Boolean, nullable=False, default=False)
    is_deleted = Column("is_deleted", Boolean, nullable=False, default=False)
    is_blacklisted = Column("is_blacklisted", Boolean, nullable=False, default=False)
    
    # Timestamps
    created_at = Column("created_at", DateTime, nullable=False, default=datetime.now)
    updated_at = Column("updated_at", DateTime, nullable=True, onupdate=datetime.now)
    
    def __repr__(self):
        return f"<Comment(id={self.comment_id}, author={self.author_name}, malicious={self.is_malicious})>"
