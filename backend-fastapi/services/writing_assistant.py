"""
AI Writing Assistant Service
텍스트 개선, 댓글 답변, 템플릿 생성 기능 제공
"""
import os
import httpx
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class Suggestion(BaseModel):
    version: int
    text: str
    tone: str
    reasoning: str
    confidence: float


class AssistantResponse(BaseModel):
    success: bool
    suggestions: List[Suggestion]
    processing_time_ms: float
    model_used: str


class WritingAssistantService:
    """AI Writing Assistant 서비스"""

    def __init__(self):
        # 장소영~여기까지: API 키 체크 강화
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama-3.1-8b-instant"
        
        if not self.api_key:
            logger.error("❌ GROQ_API_KEY not set - AI Writing Assistant will not work")
            logger.error("   Please set GROQ_API_KEY in .env file or environment variables")
        else:
            logger.info("✓ Writing Assistant API key configured")

    async def improve_text(
        self,
        text: str,
        tone: str = "polite",
        language: str = "ko",
        instruction: Optional[str] = None
    ) -> AssistantResponse:
        """텍스트 개선"""
        # 장소영~여기까지: API 키 체크
        if not self.api_key:
            import time
            start_time = time.time()
            return AssistantResponse(
                success=False,
                suggestions=[
                    Suggestion(
                        version=1,
                        text="GROQ_API_KEY가 설정되지 않았습니다. .env 파일에 GROQ_API_KEY를 설정해주세요.",
                        tone="neutral",
                        reasoning="API 키 미설정",
                        confidence=0.0
                    )
                ],
                processing_time_ms=0.0,
                model_used="error"
            )
        
        import time
        start_time = time.time()

        system_prompt = f"""You are an expert writing assistant that improves text while maintaining the original meaning.

Your task:
1. Improve clarity, grammar, and flow
2. Adjust tone to be {tone}
3. Keep the core message intact
4. Make it more professional and readable

Return ONLY a JSON object with this structure:
{{
  "suggestions": [
    {{
      "version": 1,
      "text": "improved text version 1",
      "tone": "{tone}",
      "reasoning": "brief explanation",
      "confidence": 0.95
    }},
    {{
      "version": 2,
      "text": "improved text version 2",
      "tone": "{tone}",
      "reasoning": "brief explanation",
      "confidence": 0.90
    }},
    {{
      "version": 3,
      "text": "improved text version 3",
      "tone": "{tone}",
      "reasoning": "brief explanation",
      "confidence": 0.85
    }}
  ]
}}

Provide 3 different versions with varying styles."""

        user_prompt = f"Original text ({language}):\n{text}"
        if instruction:
            user_prompt += f"\n\nAdditional instruction: {instruction}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.7,
                        "response_format": {"type": "json_object"},
                        "max_tokens": 1000,
                    },
                )

            if response.status_code != 200:
                logger.error(f"API error: {response.status_code} | {response.text[:500]}")
                return self._create_fallback_response(start_time)

            result = response.json()
            content = result["choices"][0]["message"]["content"]
            data = self._extract_json(content)

            if not data or "suggestions" not in data:
                logger.warning("Invalid response format")
                return self._create_fallback_response(start_time)

            suggestions = [
                Suggestion(**s) for s in data["suggestions"][:3]
            ]

            processing_time = (time.time() - start_time) * 1000

            return AssistantResponse(
                success=True,
                suggestions=suggestions,
                processing_time_ms=round(processing_time, 2),
                model_used=self.model
            )

        except Exception as e:
            logger.error(f"Improve text error: {e}")
            return self._create_fallback_response(start_time)

    async def generate_reply(
        self,
        comment: str,
        context: Optional[str],
        reply_type: str = "constructive",
        language: str = "ko"
    ) -> AssistantResponse:
        """댓글 답변 생성"""
        # 장소영~여기까지: API 키 체크
        if not self.api_key:
            import time
            start_time = time.time()
            return AssistantResponse(
                success=False,
                suggestions=[
                    Suggestion(
                        version=1,
                        text="GROQ_API_KEY가 설정되지 않았습니다. .env 파일에 GROQ_API_KEY를 설정해주세요.",
                        tone="neutral",
                        reasoning="API 키 미설정",
                        confidence=0.0
                    )
                ],
                processing_time_ms=0.0,
                model_used="error"
            )
        
        import time
        start_time = time.time()

        reply_type_map = {
            "constructive": "건설적이고 긍정적인 답변",
            "apology": "사과하는 톤의 답변",
            "explanation": "설명 중심의 답변",
            "neutral": "중립적인 답변"
        }
        reply_desc = reply_type_map.get(reply_type, "건설적인 답변")

        system_prompt = f"""You are a professional community manager that generates appropriate replies to comments.

Your task:
1. Generate {reply_desc}
2. Be respectful and professional
3. Address the comment appropriately
4. Keep it concise (2-3 sentences)

Return ONLY a JSON object:
{{
  "suggestions": [
    {{
      "version": 1,
      "text": "reply text version 1",
      "tone": "polite",
      "reasoning": "brief explanation",
      "confidence": 0.95
    }},
    {{
      "version": 2,
      "text": "reply text version 2",
      "tone": "polite",
      "reasoning": "brief explanation",
      "confidence": 0.90
    }},
    {{
      "version": 3,
      "text": "reply text version 3",
      "tone": "polite",
      "reasoning": "brief explanation",
      "confidence": 0.85
    }}
  ]
}}"""

        user_prompt = f"Comment to reply to ({language}):\n{comment}"
        if context:
            user_prompt += f"\n\nContext: {context}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.7,
                        "response_format": {"type": "json_object"},
                        "max_tokens": 800,
                    },
                )

            if response.status_code != 200:
                logger.error(f"API error: {response.status_code}")
                return self._create_fallback_response(start_time)

            result = response.json()
            content = result["choices"][0]["message"]["content"]
            data = self._extract_json(content)

            if not data or "suggestions" not in data:
                return self._create_fallback_response(start_time)

            suggestions = [
                Suggestion(**s) for s in data["suggestions"][:3]
            ]

            processing_time = (time.time() - start_time) * 1000

            return AssistantResponse(
                success=True,
                suggestions=suggestions,
                processing_time_ms=round(processing_time, 2),
                model_used=self.model
            )

        except Exception as e:
            logger.error(f"Generate reply error: {e}")
            return self._create_fallback_response(start_time)

    async def generate_template(
        self,
        situation: str,
        topic: str,
        tone: str = "polite",
        language: str = "ko"
    ) -> AssistantResponse:
        """템플릿 생성"""
        # 장소영~여기까지: API 키 체크
        if not self.api_key:
            import time
            start_time = time.time()
            return AssistantResponse(
                success=False,
                suggestions=[
                    Suggestion(
                        version=1,
                        text="GROQ_API_KEY가 설정되지 않았습니다. .env 파일에 GROQ_API_KEY를 설정해주세요.",
                        tone="neutral",
                        reasoning="API 키 미설정",
                        confidence=0.0
                    )
                ],
                processing_time_ms=0.0,
                model_used="error"
            )
        
        import time
        start_time = time.time()

        situation_map = {
            "promotion": "홍보/마케팅 목적",
            "announcement": "공지/안내 목적",
            "apology": "사과/해명 목적",
            "explanation": "상황 설명 목적"
        }
        situation_desc = situation_map.get(situation, "일반 목적")

        system_prompt = f"""You are a professional content writer that creates templates for {situation_desc}.

Your task:
1. Create a template suitable for {situation_desc}
2. Use {tone} tone
3. Make it reusable and adaptable
4. Include placeholders if needed (e.g., [제품명], [날짜])

Return ONLY a JSON object:
{{
  "suggestions": [
    {{
      "version": 1,
      "text": "template text version 1",
      "tone": "{tone}",
      "reasoning": "brief explanation",
      "confidence": 0.95
    }},
    {{
      "version": 2,
      "text": "template text version 2",
      "tone": "{tone}",
      "reasoning": "brief explanation",
      "confidence": 0.90
    }},
    {{
      "version": 3,
      "text": "template text version 3",
      "tone": "{tone}",
      "reasoning": "brief explanation",
      "confidence": 0.85
    }}
  ]
}}"""

        user_prompt = f"Topic/Context ({language}):\n{topic}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.7,
                        "response_format": {"type": "json_object"},
                        "max_tokens": 1000,
                    },
                )

            if response.status_code != 200:
                logger.error(f"API error: {response.status_code}")
                return self._create_fallback_response(start_time)

            result = response.json()
            content = result["choices"][0]["message"]["content"]
            data = self._extract_json(content)

            if not data or "suggestions" not in data:
                return self._create_fallback_response(start_time)

            suggestions = [
                Suggestion(**s) for s in data["suggestions"][:3]
            ]

            processing_time = (time.time() - start_time) * 1000

            return AssistantResponse(
                success=True,
                suggestions=suggestions,
                processing_time_ms=round(processing_time, 2),
                model_used=self.model
            )

        except Exception as e:
            logger.error(f"Generate template error: {e}")
            return self._create_fallback_response(start_time)

    def _extract_json(self, text: str) -> Optional[Dict]:
        """JSON 추출 헬퍼"""
        import json
        import re

        if not text:
            return None

        s = text.strip()
        s = re.sub(r"^```(?:json)?\s*", "", s, flags=re.IGNORECASE)
        s = re.sub(r"\s*```$", "", s)

        try:
            return json.loads(s)
        except Exception:
            # Find first { ... }
            start = s.find("{")
            if start == -1:
                return None
            end = s.rfind("}")
            if end == -1 or end <= start:
                return None
            try:
                return json.loads(s[start:end+1])
            except Exception:
                return None

    def _create_fallback_response(self, start_time: float) -> AssistantResponse:
        """Fallback 응답 생성"""
        import time
        processing_time = (time.time() - start_time) * 1000
        
        # 장소영~여기까지: API 키가 없을 때 더 명확한 메시지
        error_message = "AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요."
        if not self.api_key:
            error_message = "GROQ_API_KEY가 설정되지 않았습니다. .env 파일에 GROQ_API_KEY를 설정해주세요."
        
        return AssistantResponse(
            success=False,
            suggestions=[
                Suggestion(
                    version=1,
                    text=error_message,
                    tone="neutral",
                    reasoning="Fallback response",
                    confidence=0.0
                )
            ],
            processing_time_ms=round(processing_time, 2),
            model_used="fallback"
        )
