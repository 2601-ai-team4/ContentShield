from typing import Dict, Any, Optional
import logging
from langchain_community.llms import Ollama
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from app.core.prompts import SYSTEM_PROMPT, ANALYSIS_PROMPT_TEMPLATE

logger = logging.getLogger(__name__)


class LegalLLM:
    """LLM for legal analysis using Llama3 via Ollama"""
    
    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: str = "llama3",
        temperature: float = 0.3
    ):
        """
        Initialize LLM
        
        Args:
            base_url: Ollama server URL
            model: Model name (default: llama3)
            temperature: Sampling temperature (lower = more deterministic)
        """
        self.base_url = base_url
        self.model = model
        self.temperature = temperature
        
        # Initialize Ollama LLM
        self.llm = Ollama(
            base_url=base_url,
            model=model,
            temperature=temperature
        )
        
        logger.info(f"Initialized Ollama LLM with model: {model}")
    
    def analyze_comment(self, comment: str, context: str) -> Dict[str, Any]:
        """
        Analyze a comment for legal risks
        
        Args:
            comment: User comment to analyze
            context: Retrieved legal context
            
        Returns:
            Analysis result dictionary
        """
        try:
            # Create prompt
            prompt = PromptTemplate(
                input_variables=["comment", "context"],
                template=f"{SYSTEM_PROMPT}\n\n{ANALYSIS_PROMPT_TEMPLATE}"
            )
            
            # Create chain
            chain = LLMChain(llm=self.llm, prompt=prompt)
            
            # Run analysis
            response = chain.run(comment=comment, context=context)
            
            # Parse response
            result = self._parse_response(response, comment)
            
            logger.info(f"Analysis completed for comment: {comment[:50]}...")
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing comment: {e}")
            return {
                "legal_risk_level": "UNKNOWN",
                "applicable_laws": [],
                "explanation": f"분석 중 오류가 발생했습니다: {str(e)}",
                "retrieved_sources": [],
                "raw_response": ""
            }
    
    def _parse_response(self, response: str, original_comment: str) -> Dict[str, Any]:
        """
        Parse LLM response into structured format
        
        Args:
            response: Raw LLM response
            original_comment: Original comment text
            
        Returns:
            Structured analysis result
        """
        # Extract risk level
        risk_level = "MEDIUM"  # Default
        if "위험도: HIGH" in response or "위험도: high" in response.lower():
            risk_level = "HIGH"
        elif "위험도: LOW" in response or "위험도: low" in response.lower():
            risk_level = "LOW"
        elif "위험도: MEDIUM" in response or "위험도: medium" in response.lower():
            risk_level = "MEDIUM"
        
        # Extract applicable laws (simple heuristic)
        applicable_laws = []
        if "형법" in response:
            if "307" in response:
                applicable_laws.append("형법 제307조 (명예훼손)")
            if "309" in response:
                applicable_laws.append("형법 제309조 (출판물에 의한 명예훼손)")
            if "311" in response:
                applicable_laws.append("형법 제311조 (모욕)")
        if "정보통신망법" in response or "정보통신망" in response:
            if "70" in response:
                applicable_laws.append("정보통신망법 제70조 (사이버 명예훼손)")
        if "민법" in response:
            if "750" in response:
                applicable_laws.append("민법 제750조 (불법행위)")
            if "751" in response:
                applicable_laws.append("민법 제751조 (위자료)")
        
        return {
            "legal_risk_level": risk_level,
            "applicable_laws": applicable_laws,
            "explanation": response,
            "retrieved_sources": [],  # Will be added by API layer
            "raw_response": response,
            "comment": original_comment
        }
    
    def generate_simple_response(self, prompt: str) -> str:
        """
        Generate a simple text response
        
        Args:
            prompt: Input prompt
            
        Returns:
            Generated text
        """
        try:
            response = self.llm(prompt)
            return response
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"응답 생성 중 오류가 발생했습니다: {str(e)}"
