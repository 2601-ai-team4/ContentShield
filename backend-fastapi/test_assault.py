import requests
import json

url = "http://localhost:8000/analyze/text"
text = "너 싫어하니까 집 앞에 찾아가서 너를 어떻게든 떄릴거니까 문 열어라. ㅅㅂ"

payload = {
    "text": text,
    "language": "ko",
    "use_dual_model": True
}

try:
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        result = response.json()
        
        print("\n--- Analysis Result ---")
        print(f"Is Malicious: {result['is_malicious']}")
        print(f"Category: {result['category']}")
        print(f"Threat Score: {result['threat_score']}")
        print(f"Violence Score: {result['violence_score']}")
        print(f"Profanity Score: {result['profanity_score']}")
        print(f"Llama Reasoning: {result['llama_reasoning']}")
        print("-" * 30)

    else:
        print(f"Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Request failed: {e}")
