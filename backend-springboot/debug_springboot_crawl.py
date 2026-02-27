import requests
import json
import os

API_URL = "http://localhost:8081/api/comments/crawl"

def trigger_crawl():
    if not os.path.exists("token.txt"):
        print("No token found. Run setup_auth.py first.")
        return

    with open("token.txt", "r") as f:
        token = f.read().strip()

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Use the same URL as the user
    data = {
        "url": "https://youtu.be/bEcPEiy7xJ4?si=RN8x0oRvIkBc-MJC",
        "startDate": "2026-01-19",
        "endDate": "2026-01-26"
    }

    print(f"Triggering crawl for {data['url']}...")
    try:
        resp = requests.post(API_URL, headers=headers, json=data)
        print(f"Status Code: {resp.status_code}")
        print(resp.text[:1000])
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    trigger_crawl()
