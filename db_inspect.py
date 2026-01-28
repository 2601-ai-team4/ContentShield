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

    # Check analysis_results count for today
    query_today_analysis = "SELECT COUNT(*) FROM analysis_results WHERE DATE(analyzed_at) = CURDATE()"
    cursor.execute(query_today_analysis)
    today_analysis = cursor.fetchone()
    print(f"🔥 Analysis Results Today: {today_analysis}")

    # Check comments count for today (created_at)
    query_today_comments = "SELECT COUNT(*) FROM comments WHERE DATE(created_at) = CURDATE()"
    cursor.execute(query_today_comments)
    today_comments = cursor.fetchone()
    print(f"📝 Comments Created Today: {today_comments}")
    
    # Check recent results
    query_recent = "SELECT analyzed_at FROM analysis_results ORDER BY analyzed_at DESC LIMIT 5"
    cursor.execute(query_recent)
    rows = cursor.fetchall()
    print("Recent Analysis Dates:")
    for row in rows:
        print(row['analyzed_at'])

    conn.close()

except Exception as e:
    print(f"DB Error: {e}")
