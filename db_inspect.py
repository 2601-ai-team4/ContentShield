import pymysql
import sys

# DB Config
DB_CONFIG = {
    "host": "localhost",
    "port": 3307,
    "user": "root",
    "password": "1234",
    "db": "sns_content_analyzer",
    "charset": "utf8mb4"
}

search_text = "안녕하세요 선플달기 캠페인"

try:
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    # 테이블 컬럼 정보 조회로 변경
    query = "SHOW COLUMNS FROM analysis_results"
    
    cursor.execute(query)
    columns = cursor.fetchall()
    print("=== Analysis Results Table Schema ===")
    for col in columns:
        print(col)

    if result:
        print("=== DB Analysis Result ===")
        for key, value in result.items():
            print(f"{key}: {value}")
    else:
        print("No matching comment found in DB.")

    conn.close()

except Exception as e:
    print(f"DB Error: {e}")
