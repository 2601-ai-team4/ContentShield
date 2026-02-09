from typing import List, Dict, Any, Optional
import logging
from app.rag.vector_store import VectorStore
from app.rag.embedder import Embedder

logger = logging.getLogger(__name__)


class Retriever:
    """Retrieve relevant legal documents"""
    
    def __init__(
        self,
        vector_store: VectorStore,
        embedder: Embedder,
        top_k: int = 5,
        similarity_threshold: float = 0.7
    ):
        """
        Initialize retriever
        
        Args:
            vector_store: Vector store instance
            embedder: Embedder instance
            top_k: Number of documents to retrieve
            similarity_threshold: Minimum similarity score
        """
        self.vector_store = vector_store
        self.embedder = embedder
        self.top_k = top_k
        self.similarity_threshold = similarity_threshold
    
    def retrieve(
        self,
        query: str,
        category_filter: Optional[str] = None,
        top_k: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant documents for a query
        
        Args:
            query: Search query (user comment)
            category_filter: Optional category filter
            top_k: Override default top_k
            
        Returns:
            List of retrieved documents with metadata and scores
        """
        k = top_k if top_k is not None else self.top_k
        
        try:
            # Search vector store
            results = self.vector_store.search(
                query=query,
                n_results=k,
                category_filter=category_filter
            )
            
            # Format results
            retrieved_docs = []
            
            if results and results.get('documents') and len(results['documents']) > 0:
                documents = results['documents'][0]
                metadatas = results.get('metadatas', [[]])[0]
                distances = results.get('distances', [[]])[0]
                
                for i, (doc, metadata, distance) in enumerate(zip(documents, metadatas, distances)):
                    # Convert distance to similarity score (lower distance = higher similarity)
                    similarity = 1 - distance
                    
                    # Filter by similarity threshold
                    if similarity >= self.similarity_threshold:
                        retrieved_docs.append({
                            "rank": i + 1,
                            "text": doc,
                            "metadata": metadata,
                            "similarity_score": round(similarity, 4)
                        })
            
            logger.info(f"Retrieved {len(retrieved_docs)} documents (threshold: {self.similarity_threshold})")
            return retrieved_docs
            
        except Exception as e:
            logger.error(f"Error retrieving documents: {e}")
            return []
    
    def format_context(self, retrieved_docs: List[Dict[str, Any]]) -> str:
        """
        Format retrieved documents as context for LLM
        
        Args:
            retrieved_docs: List of retrieved documents
            
        Returns:
            Formatted context string
        """
        if not retrieved_docs:
            return "관련 법률 정보를 찾을 수 없습니다."
        
        context_parts = []
        
        for doc in retrieved_docs:
            metadata = doc.get("metadata", {})
            doc_type = metadata.get("type", "unknown")
            
            if doc_type in ["law", "law_key_points"]:
                context_parts.append(self._format_law_context(doc))
            elif doc_type in ["case", "case_reasoning"]:
                context_parts.append(self._format_case_context(doc))
            else:
                context_parts.append(f"[문서 {doc['rank']}]\n{doc['text']}\n")
        
        return "\n---\n".join(context_parts)
    
    def _format_law_context(self, doc: Dict[str, Any]) -> str:
        """Format law document for context"""
        metadata = doc.get("metadata", {})
        parts = [
            f"[법률 조문 {doc['rank']}]",
            f"법률명: {metadata.get('law_name', 'N/A')}",
            f"조항: {metadata.get('article', 'N/A')}",
            f"제목: {metadata.get('title', 'N/A')}",
            f"처벌: {metadata.get('penalty', 'N/A')}",
            f"\n내용:\n{doc['text']}",
            f"\n유사도: {doc['similarity_score']}"
        ]
        return "\n".join(parts)
    
    def _format_case_context(self, doc: Dict[str, Any]) -> str:
        """Format case document for context"""
        metadata = doc.get("metadata", {})
        parts = [
            f"[판례 {doc['rank']}]",
            f"사건번호: {metadata.get('case_id', 'N/A')}",
            f"제목: {metadata.get('title', 'N/A')}",
            f"법원: {metadata.get('court', 'N/A')}",
            f"판결: {metadata.get('decision', 'N/A')}",
            f"선고형: {metadata.get('penalty_imposed', 'N/A')}",
            f"\n내용:\n{doc['text']}",
            f"\n유사도: {doc['similarity_score']}"
        ]
        return "\n".join(parts)
