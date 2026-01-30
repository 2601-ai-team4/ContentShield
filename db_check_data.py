import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def check_data():
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', 3307)),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', '1234'),
            database=os.getenv('DB_NAME', 'sns_content_analyzer'),
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            print("--- Data in blacklist_users ---")
            cursor.execute("SELECT * FROM blacklist_users")
            rows = cursor.fetchall()
            for row in rows:
                print(row)
            
            print("\n--- Data in blocked_words ---")
            cursor.execute("SELECT * FROM blocked_words")
            rows = cursor.fetchall()
            for row in rows:
                print(row)
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_data()
