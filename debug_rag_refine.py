import requests
import json
import time

BASE_URL = "http://localhost:8000"

def run_query(question):
    print(f"\n❓ Question: {question}")
    try:
        response = requests.post(f"{BASE_URL}/rag/chat", json={"question": question})
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Answer: {data['answer']}")
            return data['answer']
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

def clear_history():
    print("\n🧹 Clearing History...")
    requests.post(f"{BASE_URL}/rag/clear-history")

def main():
    # 1. Clear History
    clear_history()

    # 2. Q1: Get messy comments
    print("\n--- [Step 1] Initial Question (Get Messy Data) ---")
    run_query("욕설 점수가 가장 높은 댓글 3개 내용만 보여줘")

    # 3. Q2: Ask to refine/translate
    print("\n--- [Step 2] Refinement Request ---")
    run_query("댓글 내용이 너무 거친데, 무슨 뜻인지 정제해서 알려줄래?")

if __name__ == "__main__":
    main()
