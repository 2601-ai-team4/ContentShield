
# RAG 서비스 테스트 스크립트
import asyncio
import os
from dotenv import load_dotenv
from rag_service import RAGService

load_dotenv()


async def main():
    print("Initializing RAG Service...")
    try:
        service = RAGService(model_name="gemma2:2b") 
        print("✅ Service Initialized")
    except Exception as e:
        print(f"❌ Initialization Failed: {e}")
        return

    # 테스트 문서 생성
    os.makedirs("rag_test_docs", exist_ok=True)
    with open("rag_test_docs/test.txt", "w", encoding="utf-8") as f:
        f.write("이 문서는 RAG 테스트를 위한 문서입니다.\nFaiss와 Ollama를 사용하여 질문에 답변합니다.\nGemma2 모델은 가볍고 빠릅니다.")

    print("\nLoading documents...")
    res = service.load_documents("rag_test_docs")
    print(f"Load Result: {res}")

    print("\nQuerying...")
    answer = service.query("이 문서는 무엇을 위한 것인가요?")
    print(f"Answer: {answer['answer']}")
    print(f"Sources: {answer.get('sources')}")

    # 정리
    # import shutil
    # shutil.rmtree("rag_test_docs")
    # service.clear_vector_store()

if __name__ == "__main__":
    asyncio.run(main())
