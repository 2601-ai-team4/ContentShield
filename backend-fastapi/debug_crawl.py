import requests
import json

# Test YouTube Crawl
# Use a known safe video URL
url = "http://localhost:8000/crawl/youtube"
headers = {"Content-Type": "application/json"}
data = {
    "url": "https://www.youtube.com/watch?v=wbkG5yZ_Z38"  # Example video (YTN News or anything)
}

try:
    print(f"Sending POST request to {url}...")
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    # print("Response Body:")
    # print(response.text[:500]) # Too long
except Exception as e:
    print(f"Request failed: {e}")
