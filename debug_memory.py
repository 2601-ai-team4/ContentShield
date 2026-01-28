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

    # 2. Q1: Ask for specific data
    # "가장 욕설 점수가 높은 댓글 보여줘" (Show me the comment with highest profanity score)
    # This establishes context: a specific comment or author.
    print("\n--- [Step 1] Initial Question ---")
    run_query("가장 욕설 점수가 높은 댓글의 내용을 보여줘")

    # 3. Q2: Ask follow-up using pronoun
    # "그거 누가 썼어?" (Who wrote that?)
    # "그거(that)" implies the comment found in Step 1.
    print("\n--- [Step 2] Follow-up Question (Context Test) ---")
    answer2 = run_query("그거 누가 썼어?")
    
    if answer2:
        print("\n✨ Verification Complete!")
        print("Check if the second answer reasonably refers to the first result.")

if __name__ == "__main__":
    main()
