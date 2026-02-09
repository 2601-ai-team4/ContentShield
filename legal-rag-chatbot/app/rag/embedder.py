from typing import List
import logging
from langchain_community.embeddings import OllamaEmbeddings

logger = logging.getLogger(__name__)


class Embedder:
    """Generate embeddings using Ollama"""
    
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "nomic-embed-text"):
        """
        Initialize embedder with Ollama
        
        Args:
            base_url: Ollama server URL
            model: Embedding model name (default: nomic-embed-text)
        """
        self.base_url = base_url
        self.model = model
        self.embeddings = OllamaEmbeddings(
            base_url=base_url,
            model=model
        )
        logger.info(f"Initialized Ollama embedder with model: {model}")
    
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
