import os
import logging
from rag_service import RAGService
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

try:
    api_key = os.getenv("GROQ_API_KEY")
    print(f"API Key present: {bool(api_key)}")
    rag = RAGService(model_name="llama-3.1-8b-instant", api_key=api_key)
    print("RAG Service initialized successfully")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
