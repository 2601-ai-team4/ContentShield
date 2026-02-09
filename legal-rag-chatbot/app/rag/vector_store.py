import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class VectorStore:
    """ChromaDB vector store for legal documents"""
    
    def __init__(self, persist_dir: str = "./chroma_db", collection_name: str = "legal_documents"):
        """
        Initialize ChromaDB vector store
        
        Args:
            persist_dir: Directory to persist the database
            collection_name: Name of the collection
        """
        self.persist_dir = persist_dir
        self.collection_name = collection_name
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=persist_dir,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"description": "Korean legal documents for RAG"}
        )
        
        logger.info(f"Initialized ChromaDB collection: {collection_name}")
    
    def add_documents(self, chunks: List[Dict[str, Any]]) -> None:
        """
        Add document chunks to the vector store
        
        Args:
            chunks: List of chunks with 'text', 'metadata', and optionally 'embedding'
        """
        if not chunks:
            logger.warning("No chunks to add")
            return
        
        # Prepare data for ChromaDB
        ids = [f"doc_{i}" for i in range(len(chunks))]
        documents = [chunk["text"] for chunk in chunks]
        metadatas = [chunk["metadata"] for chunk in chunks]
        
        # Check if embeddings are provided
        embeddings = None
        if chunks[0].get("embedding"):
            embeddings = [chunk["embedding"] for chunk in chunks]
        
        try:
            if embeddings:
                self.collection.add(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas,
                    embeddings=embeddings
                )
            else:
                # ChromaDB will generate embeddings automatically
                self.collection.add(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas
                )
            
            logger.info(f"Added {len(chunks)} documents to vector store")
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {e}")
            raise
    
    def search(
        self,
        query: str,
        n_results: int = 5,
        category_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Search for similar documents
        
        Args:
            query: Search query
            n_results: Number of results to return
            category_filter: Optional category filter (e.g., 'defamation', 'insult')
            
        Returns:
            Search results with documents, metadatas, and distances
        """
        try:
            # Prepare where clause for filtering
            where = None
            if category_filter:
                where = {"category": category_filter}
            
            # Perform search
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where
            )
            
            logger.info(f"Search returned {len(results['documents'][0])} results")
            return results
        except Exception as e:
            logger.error(f"Error searching vector store: {e}")
            raise
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the collection"""
        count = self.collection.count()
        return {
            "collection_name": self.collection_name,
            "document_count": count,
            "persist_dir": self.persist_dir
        }
    
    def reset_collection(self) -> None:
        """Reset the collection (delete all documents)"""
        try:
            self.client.delete_collection(name=self.collection_name)
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"description": "Korean legal documents for RAG"}
            )
            logger.info(f"Reset collection: {self.collection_name}")
        except Exception as e:
            logger.error(f"Error resetting collection: {e}")
            raise
