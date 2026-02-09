from typing import List
import logging
from langchain_community.embeddings import HuggingFaceEmbeddings

logger = logging.getLogger(__name__)


class Embedder:
    """Generate embeddings using HuggingFace sentence-transformers"""
    
    def __init__(self, model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"):
        """
        Initialize embedder with HuggingFace
        
        Args:
            model: Embedding model name (default: multilingual model for Korean support)
        """
        self.model = model
        self.embeddings = HuggingFaceEmbeddings(
            model_name=model,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        logger.info(f"Initialized HuggingFace embedder with model: {model}")
    
    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Text to embed
            
        Returns:
            List of floats representing the embedding
        """
        try:
            embedding = self.embeddings.embed_query(text)
            return embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise
    
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embeddings
        """
        try:
            embeddings = self.embeddings.embed_documents(texts)
            logger.info(f"Generated {len(embeddings)} embeddings")
            return embeddings
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise
    
    def embed_chunks(self, chunks: List[dict]) -> List[dict]:
        """
        Add embeddings to chunks
        
        Args:
            chunks: List of chunk dictionaries with 'text' field
            
        Returns:
            Chunks with added 'embedding' field
        """
        texts = [chunk["text"] for chunk in chunks]
        embeddings = self.embed_texts(texts)
        
        for chunk, embedding in zip(chunks, embeddings):
            chunk["embedding"] = embedding
        
        return chunks
