from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
import logging

from app.api.schemas import (
    CommentRequest,
    AnalysisResponse,
    IngestRequest,
    IngestResponse,
    HealthResponse,
    RetrievedSource,
    RiskLevel
)
from app.rag.document_loader import DocumentLoader
from app.rag.chunker import DocumentChunker
from app.rag.embedder import Embedder
from app.rag.vector_store import VectorStore
from app.rag.retriever import Retriever
from app.models.llm import LegalLLM
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()

# Global instances (will be initialized on startup)
vector_store: VectorStore = None
embedder: Embedder = None
retriever: Retriever = None
llm: LegalLLM = None


def initialize_services():
    """Initialize all services"""
    global vector_store, embedder, retriever, llm
    
    try:
        # Initialize vector store
        vector_store = VectorStore(
            persist_dir=settings.CHROMA_PERSIST_DIR,
            collection_name=settings.CHROMA_COLLECTION_NAME
        )
        
        # Initialize embedder
        embedder = Embedder(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_EMBEDDING_MODEL
        )
        
        # Initialize retriever
        retriever = Retriever(
            vector_store=vector_store,
            embedder=embedder,
            top_k=settings.TOP_K_RESULTS,
            similarity_threshold=settings.SIMILARITY_THRESHOLD
        )
        
        # Initialize LLM
        llm = LegalLLM(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_MODEL
        )
        
        logger.info("All services initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing services: {e}")
        raise


@router.post("/analyze_comment", response_model=AnalysisResponse)
async def analyze_comment(request: CommentRequest) -> AnalysisResponse:
    """
    Analyze a comment for legal risks
    
    Args:
        request: Comment analysis request
        
    Returns:
        Analysis result with risk level, applicable laws, and explanation
    """
    try:
        logger.info(f"Analyzing comment: {request.text[:50]}...")
        
        # Retrieve relevant legal documents
        retrieved_docs = retriever.retrieve(
            query=request.text,
            category_filter=request.category_filter
        )
        
        # Format context for LLM
        context = retriever.format_context(retrieved_docs)
        
        # Analyze with LLM
        analysis = llm.analyze_comment(
            comment=request.text,
            context=context
        )
        
        # Format retrieved sources
        sources = [
            RetrievedSource(
                rank=doc["rank"],
                type=doc["metadata"].get("type", "unknown"),
                text=doc["text"][:500] + "..." if len(doc["text"]) > 500 else doc["text"],
                metadata=doc["metadata"],
                similarity_score=doc["similarity_score"]
            )
            for doc in retrieved_docs
        ]
        
        # Create response
        response = AnalysisResponse(
            legal_risk_level=RiskLevel(analysis["legal_risk_level"]),
            applicable_laws=analysis["applicable_laws"],
            explanation=analysis["explanation"],
            retrieved_sources=sources,
            comment=request.text
        )
        
        logger.info(f"Analysis completed: {response.legal_risk_level}")
        return response
        
    except Exception as e:
        logger.error(f"Error analyzing comment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"댓글 분석 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/ingest_docs", response_model=IngestResponse)
async def ingest_documents(request: IngestRequest) -> IngestResponse:
    """
    Ingest legal documents into the vector store
    
    Args:
        request: Ingestion request
        
    Returns:
        Ingestion result
    """
    try:
        logger.info("Starting document ingestion...")
        
        # Reset collection if requested
        if request.reset_collection:
            vector_store.reset_collection()
            logger.info("Collection reset")
        
        # Load documents
        loader = DocumentLoader(data_dir="./data")
        documents = loader.load_all_documents()
        
        total_docs = len(documents["laws"]) + len(documents["cases"])
        logger.info(f"Loaded {total_docs} documents")
        
        # Chunk documents
        chunker = DocumentChunker(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        chunks = chunker.chunk_documents(documents)
        
        logger.info(f"Created {len(chunks)} chunks")
        
        # Add to vector store (ChromaDB will handle embeddings)
        vector_store.add_documents(chunks)
        
        response = IngestResponse(
            status="success",
            message="문서 인덱싱이 완료되었습니다.",
            documents_loaded=total_docs,
            chunks_created=len(chunks)
        )
        
        logger.info("Document ingestion completed")
        return response
        
    except Exception as e:
        logger.error(f"Error ingesting documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"문서 인덱싱 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Check service health
    
    Returns:
        Health status
    """
    try:
        # Check Ollama connection
        ollama_status = "connected"
        try:
            llm.generate_simple_response("test")
        except:
            ollama_status = "disconnected"
        
        # Check vector store
        vector_store_status = "ready"
        document_count = 0
        try:
            stats = vector_store.get_collection_stats()
            document_count = stats["document_count"]
        except:
            vector_store_status = "error"
        
        response = HealthResponse(
            status="healthy" if ollama_status == "connected" and vector_store_status == "ready" else "degraded",
            version=settings.APP_VERSION,
            ollama_status=ollama_status,
            vector_store_status=vector_store_status,
            document_count=document_count
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error checking health: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"헬스 체크 중 오류가 발생했습니다: {str(e)}"
        )
