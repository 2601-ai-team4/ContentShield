from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class DocumentChunker:
    """Chunk legal documents for embedding"""
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def chunk_law(self, law: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Chunk a law document
        Each law article is treated as a single chunk with metadata
        """
        chunks = []
        
        # Create main chunk with full content
        main_chunk = {
            "text": self._format_law_text(law),
            "metadata": {
                "type": "law",
                "law_name": law.get("law_name", ""),
                "category": law.get("category", ""),
                "article": law.get("article", ""),
                "title": law.get("title", ""),
                "penalty": law.get("penalty", ""),
                "source_url": law.get("source_url", "")
            }
        }
        chunks.append(main_chunk)
        
        # If content is too long, create additional chunks for key points
        if "key_points" in law and law["key_points"]:
            key_points_text = "\n".join([f"- {point}" for point in law["key_points"]])
            key_points_chunk = {
                "text": f"{law.get('law_name', '')} {law.get('article', '')} - 주요 포인트:\n{key_points_text}",
                "metadata": {
                    "type": "law_key_points",
                    "law_name": law.get("law_name", ""),
                    "category": law.get("category", ""),
                    "article": law.get("article", ""),
                    "source_url": law.get("source_url", "")
                }
            }
            chunks.append(key_points_chunk)
        
        return chunks
    
    def chunk_case(self, case: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Chunk a case law document
        Each case is treated as a single chunk with metadata
        """
        chunks = []
        
        # Create main chunk with case summary
        main_chunk = {
            "text": self._format_case_text(case),
            "metadata": {
                "type": "case",
                "case_id": case.get("case_id", ""),
                "category": case.get("category", ""),
                "title": case.get("title", ""),
                "court": case.get("court", ""),
                "date": case.get("date", ""),
                "decision": case.get("decision", ""),
                "penalty_imposed": case.get("penalty_imposed", ""),
                "applicable_laws": case.get("applicable_laws", [])
            }
        }
        chunks.append(main_chunk)
        
        # Create additional chunk for legal reasoning
        if "legal_reasoning" in case and case["legal_reasoning"]:
            reasoning_chunk = {
                "text": f"판례 {case.get('case_id', '')} 법률적 판단:\n{case['legal_reasoning']}",
                "metadata": {
                    "type": "case_reasoning",
                    "case_id": case.get("case_id", ""),
                    "category": case.get("category", ""),
                    "applicable_laws": case.get("applicable_laws", [])
                }
            }
            chunks.append(reasoning_chunk)
        
        return chunks
    
    def chunk_documents(self, documents: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """Chunk all documents"""
        all_chunks = []
        
        # Chunk laws
        for law in documents.get("laws", []):
            try:
                chunks = self.chunk_law(law)
                all_chunks.extend(chunks)
            except Exception as e:
                logger.error(f"Error chunking law {law.get('article', 'unknown')}: {e}")
        
        # Chunk cases
        for case in documents.get("cases", []):
            try:
                chunks = self.chunk_case(case)
                all_chunks.extend(chunks)
            except Exception as e:
                logger.error(f"Error chunking case {case.get('case_id', 'unknown')}: {e}")
        
        logger.info(f"Created {len(all_chunks)} chunks from {len(documents.get('laws', []))} laws and {len(documents.get('cases', []))} cases")
        return all_chunks
    
    def _format_law_text(self, law: Dict[str, Any]) -> str:
        """Format law document as text"""
        parts = [
            f"법률: {law.get('law_name', '')}",
            f"조항: {law.get('article', '')}",
            f"제목: {law.get('title', '')}",
            f"\n내용:\n{law.get('content', '')}",
            f"\n처벌: {law.get('penalty', '')}"
        ]
        
        if "key_points" in law and law["key_points"]:
            points = "\n".join([f"- {point}" for point in law["key_points"]])
            parts.append(f"\n주요 포인트:\n{points}")
        
        return "\n".join(parts)
    
    def _format_case_text(self, case: Dict[str, Any]) -> str:
        """Format case document as text"""
        parts = [
            f"판례번호: {case.get('case_id', '')}",
            f"제목: {case.get('title', '')}",
            f"법원: {case.get('court', '')}",
            f"선고일: {case.get('date', '')}",
            f"\n사건 요약:\n{case.get('summary', '')}",
            f"\n사실관계:\n{case.get('facts', '')}",
            f"\n판결: {case.get('decision', '')}",
            f"선고형: {case.get('penalty_imposed', '')}"
        ]
        
        if "applicable_laws" in case and case["applicable_laws"]:
            laws = ", ".join(case["applicable_laws"])
            parts.append(f"\n적용 법률: {laws}")
        
        if "key_points" in case and case["key_points"]:
            points = "\n".join([f"- {point}" for point in case["key_points"]])
            parts.append(f"\n주요 포인트:\n{points}")
        
        return "\n".join(parts)
