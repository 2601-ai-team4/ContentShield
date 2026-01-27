import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def list_all_tables():
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
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print("Tables found:")
            for t in tables:
                print(list(t.values())[0])
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_all_tables()
