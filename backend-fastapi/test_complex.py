import requests
import json
import time

url = "http://localhost:8000/analyze/text"

# 복합적인 유해 요소를 가진 문장들
test_cases = [
    # Case 1: 성희롱(Sexual) vs 위협(Threat)
    # "찾아가서 덮친다"는 위협성이 매우 높으나, 성적 의도도 있음.
    # Threat 점수가 더 높게 나와서 'Threat'로 분류되어야 함 (기존엔 순서 때문에 Sexual 가능성)
    "주소 다 아니까 오늘 밤에 찾아가서 덮쳐버릴 거야. 도망칠 생각 마.",

    # Case 2: 욕설(Profanity) vs 혐오(Hate)
    # 욕설도 있지만, '특정 집단 비하'가 핵심이므로 Hate 점수가 더 높아야 함.
    "이런 개병신 같은 [특정지역] 놈들은 싹 다 가스실 보내야 돼.",
    
    # Case 3: 폭력(Violence) vs 위협(Threat)
    # 아까의 예시와 비슷. 흉기 위협.
    "칼 들고 네 목 따러 지금 출발했다."
]

for text in test_cases:
    payload = {
        "text": text,
        "language": "ko",
        "use_dual_model": True
    }
    
    try:
        print(f"\nEvaluating: '{text}'")
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            result = response.json()
            cat = result['category']
            
            # 주요 경쟁 점수들 출력
            scores = {
                "Threat": result['threat_score'],
                "Violence": result['violence_score'],
                "Sexual": result['sexual_score'],
                "Hate": result['hate_speech_score'],
                "Profanity": result['profanity_score']
            }
            # 0점 제외하고 정렬해서 출력
            sorted_scores = sorted({k:v for k,v in scores.items() if v > 0}.items(), key=lambda x:x[1], reverse=True)
            
            print(f"  -> Determined Category: [ {cat} ]")
            print(f"  -> Top Scores: {sorted_scores}")
            
    except Exception as e:
        print(f"  Request failed: {e}")
    
    time.sleep(1)
