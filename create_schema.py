
import pymysql
import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3307)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', '1234'),
    'database': os.getenv('DB_NAME', 'sns_content_analyzer'),
    'charset': 'utf8mb4'
}

# ... (Previous DDLs omitted for brevity, will include ALL in actual file) ...

def insert_dummy_data(cursor):
    print("Inserting Dummy Data...")
    
    # 1. Get/Create Admin User
    cursor.execute("SELECT user_id FROM users WHERE email='admin@example.com'")
    row = cursor.fetchone()
    if not row:
        cursor.execute("""
            INSERT INTO users (email, password_hash, username, role, status, created_at)
            VALUES ('admin@example.com', '$2a$10$dummyHashValueForTesting', 'SuperAdmin', 'ADMIN', 'ACTIVE', NOW())
        """)
        user_id = cursor.lastrowid
        print(f" -> Created Admin User (ID: {user_id})")
    else:
        user_id = row['user_id']
        print(f" -> Found Admin User (ID: {user_id})")

    # 2. Insert Notices
    cursor.execute("SELECT count(*) as cnt FROM notices")
    if cursor.fetchone()['cnt'] == 0:
        cursor.execute(f"""
            INSERT INTO notices (admin_id, title, content, notice_type, is_pinned, created_at) VALUES 
            ({user_id}, '서비스 긴급 점검 안내', '금일 밤 10시부터 12시까지 서버 점검이 있습니다.', 'MAINTENANCE', TRUE, NOW()),
            ({user_id}, '신규 기능 업데이트: AI 필터링', 'AI 기반 자동 필터링 기능이 추가되었습니다.', 'UPDATE', FALSE, NOW() - INTERVAL 1 DAY)
        """)
        print(" -> Inserted Notices")

    # 3. Insert Comments & Analysis Results (CRITICAL FOR DASHBOARD)
    cursor.execute(f"SELECT count(*) as cnt FROM comments WHERE user_id={user_id}")
    if cursor.fetchone()['cnt'] < 10:
        platforms = ['YOUTUBE', 'INSTAGRAM', 'TIKTOK']
        categories = ['safe', 'moderately_toxic', 'profanity', 'insult', 'violence']
        
        for i in range(50):
            is_malicious = random.choice([True, False])
            category = random.choice(categories) if is_malicious else 'safe'
            platform = random.choice(platforms)
            hours_ago = random.randint(0, 168) # 7 days
            
            # 3-1. Insert Comment
            sql_comment = """
                INSERT INTO comments 
                (user_id, platform, external_comment_id, author_name, content, 
                 commented_at, is_analyzed, is_malicious, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW() - INTERVAL %s HOUR, TRUE, %s, NOW())
            """
            content = f"Test comment {i}"
            cursor.execute(sql_comment, (user_id, platform, f"ext_{i}", f"User_{i}", content, hours_ago, is_malicious))
            comment_id = cursor.lastrowid

            # 3-2. Insert Analysis Result (Linked to Comment)
            # DashboardStats relies on THIS table
            sql_analysis = """
                INSERT INTO analysis_results 
                (comment_id, user_id, toxicity_score, hate_speech_score, profanity_score, 
                 threat_score, violence_score, sexual_score, fake_news_score, 
                 confidence_score, category, ai_model_version, processing_time_ms, analyzed_at)
                VALUES (%s, %s, %s, 0.1, 0.1, 0.0, 0.0, 0.0, 0.0, 0.95, %s, 'v1.0', 150, NOW() - INTERVAL %s HOUR)
            """
            tox_score = 0.85 if is_malicious else 0.05
            cursor.execute(sql_analysis, (comment_id, user_id, tox_score, category, hours_ago))
        
        print(f" -> Inserted 50 Comments & Analysis Results for User {user_id}")

def create_schema():
    # ... (Connection Logic) ...
    try:
        conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']}")
            cursor.execute(f"USE {DB_CONFIG['database']}")
            
            # (Create Tables DDLs here - ensuring analysis_results is included)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS analysis_results (
                    analysis_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    comment_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    content_url TEXT,
                    author VARCHAR(200),
                    comment_text TEXT,
                    toxicity_score DECIMAL(5,2) NOT NULL DEFAULT 0,
                    hate_speech_score DECIMAL(5,2) NOT NULL DEFAULT 0,
                    profanity_score DECIMAL(5,2) NOT NULL DEFAULT 0,
                    threat_score DECIMAL(5,2) NOT NULL DEFAULT 0,
                    violence_score DECIMAL(5,2),
                    sexual_score DECIMAL(5,2),
                    fake_news_score DECIMAL(5,2),
                    confidence_score DECIMAL(5,2),
                    category VARCHAR(50) NOT NULL,
                    detected_keywords TEXT,
                    ai_reasoning TEXT,
                    ai_model_version VARCHAR(50),
                    processing_time_ms INT NOT NULL DEFAULT 0,
                    analyzed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)
            # ... execute other DDLs ...
            
            insert_dummy_data(cursor)
            conn.commit()
            print("✅ Schema & Data Setup Complete!")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'conn' in locals() and conn.open: conn.close()
        
if __name__ == '__main__':
    create_schema()
