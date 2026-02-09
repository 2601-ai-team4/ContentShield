from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import sys

from app.api.routes import router, initialize_services
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="한국 법률 기반 악성댓글 처벌 가능성 분석 RAG 챗봇 시스템",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router, prefix="/api", tags=["Legal Analysis"])


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    try:
        # Initialize all services
        initialize_services()
        logger.info("Services initialized successfully")
        
        # Auto-ingest documents if vector store is empty
        from app.rag.vector_store import VectorStore
        from app.rag.document_loader import DocumentLoader
        from app.rag.chunker import DocumentChunker
        
        vector_store = VectorStore(
            persist_dir=settings.CHROMA_PERSIST_DIR,
            collection_name=settings.CHROMA_COLLECTION_NAME
        )
        
        stats = vector_store.get_collection_stats()
        if stats["document_count"] == 0:
            logger.info("Vector store is empty, auto-ingesting documents...")
            
            loader = DocumentLoader(data_dir="./data")
            documents = loader.load_all_documents()
            
            chunker = DocumentChunker(
                chunk_size=settings.CHUNK_SIZE,
                chunk_overlap=settings.CHUNK_OVERLAP
            )
            chunks = chunker.chunk_documents(documents)
            
            vector_store.add_documents(chunks)
            logger.info(f"Auto-ingested {len(chunks)} chunks")
        else:
            logger.info(f"Vector store already contains {stats['document_count']} documents")
        
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info(f"Shutting down {settings.APP_NAME}")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Legal RAG Chatbot API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
