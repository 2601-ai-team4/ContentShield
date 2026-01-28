import time
import requests
import statistics
import os
from concurrent.futures import ThreadPoolExecutor
from langsmith import traceable
from dotenv import load_dotenv

# Load environment variables
load_dotenv("backend-fastapi/.env")

# Test Data
COMMENTS = [
    "정말 좋은 영상이네요! 감사합니다.", 
    "이딴 쓰레기 영상을 왜 올리냐? 죽어라.", 
    "목소리가 너무 좋으시네요. 구독 눌렀습니다.", 
    "진짜 재미없다. 시간 낭비했네.", 
    "너 같은 놈은 유튜브 접어라.", 
    "정보가 유익해요. 다음 영상도 기대할게요.", 
    "광고 신고했습니다. ^^", 
    "사랑해요!", 
    "미친놈 ㅋㅋㅋ", 
    "화이팅입니다!" 
]

BASE_URL = "http://localhost:8000/analyze/text"

MODELS = [
    {"name": "Llama 3.1 8B", "id": "llama-3.1-8b-instant"},
    {"name": "Gemma 2 9B", "id": "gemma2-9b-it"},
    {"name": "Mixtral 8x7B", "id": "mixtral-8x7b-32768"}
]

@traceable(run_type="chain", name="LLM Benchmark Request")
def send_request(comment, model_id):
    start = time.time()
    try:
        payload = {
            "text": comment,
            "use_dual_model": False,  # Single model mode for fair LLM comparison
            "model_name": model_id
        }
        response = requests.post(BASE_URL, json=payload, timeout=30)
        response.raise_for_status()
        duration = (time.time() - start) * 1000 # ms
        return duration, True
    except Exception as e:
        print(f"[{model_id}] Request failed: {e}")
        return 0, False

def run_model_test(model_info, iterations=10):
    print(f"\n🚀 Testing: {model_info['name']} ({model_info['id']})")
    print(f"   Sending {iterations} requests...")
    
    latencies = []
    success_count = 0
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = []
        for i in range(iterations):
            comment = COMMENTS[i % len(COMMENTS)]
            futures.append(executor.submit(send_request, comment, model_info['id']))
            
        for f in futures:
            dur, success = f.result()
            if success:
                latencies.append(dur)
                success_count += 1
                
    total_time = time.time() - start_time
    
    if not latencies:
        return None

    avg_lat = statistics.mean(latencies)
    throughput = success_count / total_time
    
    return {
        "name": model_info['name'],
        "id": model_info['id'],
        "avg_ms": avg_lat,
        "throughput": throughput,
        "success_rate": (success_count/iterations)*100
    }

def main():
    print("="*70)
    print("🧠 LLM Speed Benchmark (Groq Cloud)")
    print("="*70)
    
    # Warmup
    try:
        requests.post(BASE_URL, json={"text": "warmup", "use_dual_model": False, "model_name": "llama-3.1-8b-instant"}, timeout=5)
    except: pass
    
    results = []
    for model in MODELS:
        res = run_model_test(model)
        if res:
            results.append(res)
        time.sleep(2)
    
    print("\n" + "="*70)
    print(f"{'Model':<20} | {'Avg Latency':<15} | {'Throughput':<15}")
    print("-" * 70)
    for r in results:
        print(f"{r['name']:<20} | {r['avg_ms']:.1f} ms        | {r['throughput']:.1f} req/s")
    print("="*70)

if __name__ == "__main__":
    main()
