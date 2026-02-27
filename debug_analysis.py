import requests
import json

url = "http://localhost:8000/analyze/text"
text = """안녕하세요 선플달기 캠페인을 하는 향남중학교 학생입니다ㅏ 매일 숙제나 공부를 하면서 여러 플리들을 많이 찾아보는데 특히 요즘에 새로운 플리를 찾다가 이 영상을 발견하게 되었어요!) 근데 진짜 기분이 좋아지는 플리! 숙제하면서 기분이 오랜만에 괜찮았어요)) 다른 아이돌 노래를 틀고 하면 신나서 집중도 안 되고 숙제를 제대로 잘 못하는 경우가 많은데 이 플리는 다른 노래와는 달리 집중도 잘 되어서 무엇보다 집중이 더 잘 되고 덕분에 더 기분 좋게 숙제를 끝낼 수 있었어요 이렇게 좋은 노래 많이 만들어주셔서 너무 감사하고 앞으로도 이런 노래 계속 만들어주세요오☺️ 감사합니다!"""

payload = {
    "text": text,
    "language": "ko",
    "use_dual_model": True
}

try:
    response = requests.post(url, json=payload)
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")
