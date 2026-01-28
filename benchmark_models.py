import time
import requests
import statistics
import os
from concurrent.futures import ThreadPoolExecutor
from langsmith import traceable
from dotenv import load_dotenv

# Load environment variables (for LangSmith API Key)
load_dotenv("backend-fastapi/.env")

# Test Data (Mixed Safe/Toxic)
COMMENTS = [
    "정말 좋은 영상이네요! 감사합니다.", # Safe
    "이딴 쓰레기 영상을 왜 올리냐? 죽어라.", # Toxic
    "목소리가 너무 좋으시네요. 구독 눌렀습니다.", # Safe
    "진짜 재미없다. 시간 낭비했네.", # Toxic (Mild)
    "너 같은 놈은 유튜브 접어라.", # Toxic
    "정보가 유익해요. 다음 영상도 기대할게요.", # Safe
    "광고 신고했습니다. ^^", # Toxic (Passive Aggressive)
    "사랑해요!", # Safe
    "미친놈 ㅋㅋㅋ", # Toxic
    "화이팅입니다!" # Safe
]

BASE_URL = "http://localhost:8000/analyze/text"

@traceable(run_type="chain", name="Benchmark Request")
def send_request(comment, use_dual):
    start = time.time()
    try:
        payload = {
            "text": comment,
            "use_dual_model": use_dual
        }
        # Timeout 30s to prevent hang
        response = requests.post(BASE_URL, json=payload, timeout=30)
        response.raise_for_status()
        duration = (time.time() - start) * 1000 # ms
        return duration, True
    except Exception as e:
        print(f"Request failed: {e}")
        return 0, False

def run_scenario(name, use_dual, iterations=20):
    print(f"\n🚀 Starting Scenario: {name}")
    print(f"   Mode: {'Dual (Guard+Analysis)' if use_dual else 'Single (Analysis Only)'}")
    print(f"   Sending {iterations} requests (Concurrency: 4)...")
    
    latencies = []
    success_count = 0
    start_time = time.time()
    
    # Use ThreadPool to simulate concurrent traffic
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = []
        for i in range(iterations):
            comment = COMMENTS[i % len(COMMENTS)]
            futures.append(executor.submit(send_request, comment, use_dual))
            
        for f in futures:
            dur, success = f.result()
            if success:
                latencies.append(dur)
                success_count += 1
                
    total_time = time.time() - start_time
    
    if not latencies:
        return None

    avg_lat = statistics.mean(latencies)
    # Simple P95 calculation
    sorted_lat = sorted(latencies)
    p95_lat = sorted_lat[int(len(sorted_lat) * 0.95)] if len(sorted_lat) >= 20 else sorted_lat[-1]
    throughput = success_count / total_time
    
    return {
        "name": name,
        "avg_ms": avg_lat,
        "p95_ms": p95_lat,
        "throughput": throughput,
        "success_rate": (success_count/iterations)*100
    }

def main():
    print("="*70)
    print("⚡ AI Model Performance Benchmark (with LangSmith Tracing)")
    print("="*70)
    
    # 1. Warm-up
    print("🔥 Warming up server...")
    try:
        requests.post(BASE_URL, json={"text": "warmup", "use_dual_model": True}, timeout=5)
    except:
        pass
    
    # 2. Run Scenarios
    results = []
    results.append(run_scenario("A. Dual Model Strategy", True, iterations=20))
    # Wait a bit to let server cool down
    time.sleep(2)
    results.append(run_scenario("B. Single Model Strategy", False, iterations=20))
    
    # 3. Report
    print("\n" + "="*70)
    print(f"{'Scenario':<30} | {'Avg (ms)':<10} | {'P95 (ms)':<10} | {'TPS':<10}")
    print("-" * 70)
    for r in results:
        if r:
            print(f"{r['name']:<30} | {r['avg_ms']:.1f} ms   | {r['p95_ms']:.1f} ms   | {r['throughput']:.1f} req/s")
    print("="*70)
    print(f"\n📊 Detailed Traces available at LangSmith Dashboard")

if __name__ == "__main__":
    main()
