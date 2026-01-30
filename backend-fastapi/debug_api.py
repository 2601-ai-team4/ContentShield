import requests
import json

#Test 1: Improve Text
url = "http://localhost:8000/api/assistant/improve"
headers = {"Content-Type": "application/json"}
data = {
    "text": "이거 별로네",
    "tone": "polite",
    "language": "ko"
}

try:
    print(f"Sending POST request to {url}...")
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(response.text)
except Exception as e:
    print(f"Request failed: {e}")
