import json


# Test samples for API testing
test_samples = [
    {
        "name": "명예훼손 - HIGH",
        "comment": "OOO는 사기꾼이다. 돈을 빌려주고 갚지 않았다.",
        "expected_risk": "HIGH",
        "category_filter": None
    },
    {
        "name": "모욕 - MEDIUM",
        "comment": "너 정말 바보같다. 인간말종이야.",
        "expected_risk": "MEDIUM",
        "category_filter": None
    },
    {
        "name": "정상 댓글 - LOW",
        "comment": "이 제품은 별로인 것 같아요. 가격 대비 성능이 아쉽습니다.",
        "expected_risk": "LOW",
        "category_filter": None
    },
    {
        "name": "사이버 명예훼손 - HIGH",
        "comment": "이 사람 전과자입니다. 조심하세요.",
        "expected_risk": "HIGH",
        "category_filter": "defamation"
    },
    {
        "name": "허위사실 유포 - HIGH",
        "comment": "XXX 회사는 직원 월급을 안 준다고 들었어요.",
        "expected_risk": "HIGH",
        "category_filter": "defamation"
    },
    {
        "name": "개인정보 침해 - HIGH",
        "comment": "OOO의 주소는 서울시 XX구 XX동 123번지입니다.",
        "expected_risk": "HIGH",
        "category_filter": "privacy_violation"
    }
]


# Save to JSON file
with open("test_samples.json", "w", encoding="utf-8") as f:
    json.dump(test_samples, f, ensure_ascii=False, indent=2)

print(f"Created {len(test_samples)} test samples")
print("\nTest samples:")
for sample in test_samples:
    print(f"  - {sample['name']}: {sample['comment'][:50]}...")
