import pymysql

# Database Configuration
config = {
    'host': 'localhost',
    'port': 3307,
    'user': 'root',
    'password': '1234',
    'database': 'sns_content_analyzer',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def reset_db():
    try:
        connection = pymysql.connect(**config)
        try:
            with connection.cursor() as cursor:
                # Disable FK checks to allow dropping tables in any order
                print("Disabling foreign key checks...")
                cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
                
                # Drop tables
                tables = ['analysis_results', 'comments']
                for table in tables:
                    print(f"Dropping table: {table}")
                    cursor.execute(f"DROP TABLE IF EXISTS {table};")
                
                # Enable FK checks
                print("Enabling foreign key checks...")
                cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
                
                connection.commit()
                print("Database tables dropped successfully.")
        finally:
            connection.close()
    except Exception as e:
        print(f"Error resetting database: {e}")

if __name__ == "__main__":
    reset_db()
