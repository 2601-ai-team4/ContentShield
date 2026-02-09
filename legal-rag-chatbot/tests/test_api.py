import requests
import json
from typing import Dict, Any


BASE_URL = "http://localhost:8000/api"


def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    return response.status_code == 200


def test_analyze_comment(comment: str, category_filter: str = None):
    """Test comment analysis endpoint"""
    print(f"\n=== Testing Comment Analysis ===")
    print(f"Comment: {comment}")
    
    payload = {"text": comment}
    if category_filter:
        payload["category_filter"] = category_filter
    
    response = requests.post(
        f"{BASE_URL}/analyze_comment",
        json=payload
    )
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"\nRisk Level: {result['legal_risk_level']}")
        print(f"Applicable Laws: {', '.join(result['applicable_laws'])}")
        print(f"\nExplanation:\n{result['explanation'][:500]}...")
        print(f"\nRetrieved Sources: {len(result['retrieved_sources'])}")
        return result
    else:
        print(f"Error: {response.text}")
        return None


def test_ingest_docs(reset: bool = False):
    """Test document ingestion endpoint"""
    print("\n=== Testing Document Ingestion ===")
    
    payload = {"reset_collection": reset}
    response = requests.post(
        f"{BASE_URL}/ingest_docs",
        json=payload
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    return response.status_code == 200


def run_all_tests():
    """Run all API tests"""
    print("=" * 60)
    print("Legal RAG Chatbot API Tests")
    print("=" * 60)
    
    # Test 1: Health check
    health_ok = test_health()
    if not health_ok:
        print("\n❌ Health check failed! Make sure the server is running.")
        return
    
    print("\n✅ Health check passed!")
    
    # Test 2: Sample comments
    test_comments = [
        ("너는 정말 바보같다", None),
        ("OOO는 사기꾼이다", "defamation"),
        ("이 제품은 별로인 것 같아요", None),
    ]
    
    for comment, category in test_comments:
        result = test_analyze_comment(comment, category)
        if result:
            print(f"✅ Analysis completed: {result['legal_risk_level']}")
        else:
            print("❌ Analysis failed")
    
    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    run_all_tests()
