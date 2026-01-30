"""
AI Writing Assistant Router
/api/assistant/* 엔드포인트 제공
"""
# 장소영~여기까지: .env 로딩을 최상단에 배치 (서비스 초기화 전에 환경 변수 로드 보장)
import os
from pathlib import Path
from dotenv import load_dotenv

# ✅ routers/assistant.py가 있는 폴더의 상위 폴더(backend-fastapi)의 .env를 로드
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, List
import logging

import sys

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from services.writing_assistant import WritingAssistantService, AssistantResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

# 장소영~여기까지: 서비스 인스턴스 생성 (이 시점에 .env가 이미 로드되어 있어야 함)
assistant_service = WritingAssistantService()


# ==================== Request Models ====================

class ImproveRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    tone: str = Field(default="polite", description="polite/neutral/friendly/formal/casual")
    language: str = Field(default="ko", description="ko/en")
    instruction: Optional[str] = Field(default=None, max_length=500)


class ReplyRequest(BaseModel):
    comment: str = Field(..., min_length=1, max_length=2000)
    context: Optional[str] = Field(default=None, max_length=1000)
    reply_type: str = Field(default="constructive", description="constructive/apology/explanation/neutral")
    language: str = Field(default="ko", description="ko/en")


class TemplateRequest(BaseModel):
    situation: str = Field(..., description="promotion/announcement/apology/explanation")
    topic: str = Field(..., min_length=1, max_length=1000)
    tone: str = Field(default="polite", description="polite/neutral/friendly/formal/casual")
    language: str = Field(default="ko", description="ko/en")


# ==================== Endpoints ====================

@router.post("/improve", response_model=AssistantResponse)
async def improve_text(request: ImproveRequest):
    """
    텍스트 개선
    - 3가지 버전의 개선된 텍스트 제공
    """
    try:
        result = await assistant_service.improve_text(
            text=request.text,
            tone=request.tone,
            language=request.language,
            instruction=request.instruction
        )
        return result
    except Exception as e:
        logger.error(f"Improve text error: {e}")
        raise HTTPException(status_code=500, detail=f"Text improvement failed: {str(e)}")


@router.post("/reply", response_model=AssistantResponse)
async def generate_reply(request: ReplyRequest):
    """
    댓글 답변 생성
    - 3가지 버전의 답변 제공
    """
    try:
        result = await assistant_service.generate_reply(
            comment=request.comment,
            context=request.context,
            reply_type=request.reply_type,
            language=request.language
        )
        return result
    except Exception as e:
        logger.error(f"Generate reply error: {e}")
        raise HTTPException(status_code=500, detail=f"Reply generation failed: {str(e)}")


@router.post("/template", response_model=AssistantResponse)
async def generate_template(request: TemplateRequest):
    """
    템플릿 생성
    - 3가지 버전의 템플릿 제공
    """
    try:
        result = await assistant_service.generate_template(
            situation=request.situation,
            topic=request.topic,
            tone=request.tone,
            language=request.language
        )
        return result
    except Exception as e:
        logger.error(f"Generate template error: {e}")
        raise HTTPException(status_code=500, detail=f"Template generation failed: {str(e)}")


@router.get("/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "service": "AI Writing Assistant",
        "api_configured": bool(assistant_service.api_key)
    }
