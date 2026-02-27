import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def check_db():
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
            # List all tables
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print("Tables in database:", [list(t.values())[0] for t in tables])
            
            for table in tables:
                table_name = list(table.values())[0]
                if 'blacklist' in table_name.lower() or 'blocked' in table_name.lower():
                    print(f"\n--- Structure of {table_name} ---")
                    cursor.execute(f"DESCRIBE {table_name}")
                    columns = cursor.fetchall()
                    for col in columns:
                        print(col)
                    
                    cursor.execute(f"SELECT COUNT(*) as count FROM {table_name}")
                    count = cursor.fetchone()
                    print(f"Row count: {count['count']}")
                    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
