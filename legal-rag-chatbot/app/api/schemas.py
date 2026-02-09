from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class RiskLevel(str, Enum):
    """Legal risk level enumeration"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    UNKNOWN = "UNKNOWN"


class CommentRequest(BaseModel):
    """Request schema for comment analysis"""
    text: str = Field(..., description="댓글 텍스트", min_length=1, max_length=1000)
    category_filter: Optional[str] = Field(None, description="카테고리 필터 (defamation, insult, hate_speech, privacy_violation)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "너는 정말 바보같다",
                "category_filter": None
            }
        }


class RetrievedSource(BaseModel):
    """Retrieved legal source"""
    rank: int = Field(..., description="검색 순위")
    type: str = Field(..., description="문서 타입 (law, case)")
    text: str = Field(..., description="문서 내용")
    metadata: Dict[str, Any] = Field(..., description="메타데이터")
    similarity_score: float = Field(..., description="유사도 점수")


class AnalysisResponse(BaseModel):
    """Response schema for comment analysis"""
    legal_risk_level: RiskLevel = Field(..., description="법적 위험도")
    applicable_laws: List[str] = Field(..., description="적용 가능한 법률 조항")
    explanation: str = Field(..., description="분석 설명")
    retrieved_sources: List[RetrievedSource] = Field(..., description="검색된 법률 자료")
    comment: str = Field(..., description="분석한 댓글")
    disclaimer: str = Field(
        default="본 분석은 참고용이며, 실제 법률 자문이 필요한 경우 변호사와 상담하시기 바랍니다.",
        description="면책 조항"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "legal_risk_level": "MEDIUM",
                "applicable_laws": ["형법 제311조 (모욕)"],
                "explanation": "해당 댓글은 구체적 사실을 적시하지 않고 추상적인 경멸 표현을 사용하여 모욕죄에 해당할 수 있습니다...",
                "retrieved_sources": [],
                "comment": "너는 정말 바보같다",
                "disclaimer": "본 분석은 참고용이며, 실제 법률 자문이 필요한 경우 변호사와 상담하시기 바랍니다."
            }
        }


class IngestRequest(BaseModel):
    """Request schema for document ingestion"""
    reset_collection: bool = Field(False, description="기존 컬렉션 초기화 여부")
    
    class Config:
        json_schema_extra = {
            "example": {
                "reset_collection": False
            }
        }


class IngestResponse(BaseModel):
    """Response schema for document ingestion"""
    status: str = Field(..., description="처리 상태")
    message: str = Field(..., description="처리 메시지")
    documents_loaded: int = Field(..., description="로드된 문서 수")
    chunks_created: int = Field(..., description="생성된 청크 수")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "message": "문서 인덱싱이 완료되었습니다.",
                "documents_loaded": 17,
                "chunks_created": 34
            }
        }


class HealthResponse(BaseModel):
    """Response schema for health check"""
    status: str = Field(..., description="서비스 상태")
    version: str = Field(..., description="버전")
    ollama_status: str = Field(..., description="Ollama 연결 상태")
    vector_store_status: str = Field(..., description="벡터 DB 상태")
    document_count: int = Field(..., description="인덱싱된 문서 수")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "ollama_status": "connected",
                "vector_store_status": "ready",
                "document_count": 34
            }
        }
