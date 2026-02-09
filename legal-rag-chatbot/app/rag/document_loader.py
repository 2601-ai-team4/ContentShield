import json
from pathlib import Path
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class DocumentLoader:
    """Load legal documents from JSON files"""
    
    def __init__(self, data_dir: str = "./data"):
        self.data_dir = Path(data_dir)
        self.laws_dir = self.data_dir / "laws"
        self.cases_dir = self.data_dir / "cases"
    
    def load_laws(self) -> List[Dict[str, Any]]:
        """Load all law documents from the laws directory"""
        all_laws = []
        
        if not self.laws_dir.exists():
            logger.warning(f"Laws directory not found: {self.laws_dir}")
            return all_laws
        
        for json_file in self.laws_dir.glob("*.json"):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    laws = json.load(f)
                    all_laws.extend(laws)
                logger.info(f"Loaded {len(laws)} laws from {json_file.name}")
            except Exception as e:
                logger.error(f"Error loading {json_file}: {e}")
        
        return all_laws
    
    def load_cases(self) -> List[Dict[str, Any]]:
        """Load all case law documents from the cases directory"""
        all_cases = []
        
        if not self.cases_dir.exists():
            logger.warning(f"Cases directory not found: {self.cases_dir}")
            return all_cases
        
        for json_file in self.cases_dir.glob("*.json"):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    cases = json.load(f)
                    all_cases.extend(cases)
                logger.info(f"Loaded {len(cases)} cases from {json_file.name}")
            except Exception as e:
                logger.error(f"Error loading {json_file}: {e}")
        
        return all_cases
    
    def load_all_documents(self) -> Dict[str, List[Dict[str, Any]]]:
        """Load all documents (laws and cases)"""
        return {
            "laws": self.load_laws(),
            "cases": self.load_cases()
        }
    
    def validate_document(self, doc: Dict[str, Any], doc_type: str) -> bool:
        """Validate document structure"""
        if doc_type == "law":
            required_fields = ["law_name", "category", "article", "content"]
        elif doc_type == "case":
            required_fields = ["case_id", "category", "summary", "applicable_laws"]
        else:
            return False
        
        return all(field in doc for field in required_fields)
