import os
import oracledb
from dotenv import load_dotenv

load_dotenv()

db_config = {
    "user": os.getenv("DB_USER", "system"),
    "password": os.getenv("DB_PASSWORD", "123"),
    "dsn": f"{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '1521')}/{os.getenv('DB_SID', 'xe')}"
}

connection = None

async def init_database():
    global connection
    try:
        connection = oracledb.connect(**db_config)
        print("Connected to Oracle Database")
        
        # Create sequences
        await create_sequence_if_not_exists("USERS_SEQ")
        await create_sequence_if_not_exists("TRANSACTIONS_SEQ")
        await create_sequence_if_not_exists("GOALS_SEQ")
        
        # Check and create tables
        await check_and_create_users_table()
        await check_and_create_transactions_table()
        await check_and_create_goals_table()
        
        print("Database initialized successfully")
        return connection
    except Exception as error:
        print(f"Database initialization error: {error}")
        raise error

async def create_sequence_if_not_exists(seq_name):
    cursor = connection.cursor()
    try:
        cursor.execute(f"""
            BEGIN
                EXECUTE IMMEDIATE 'CREATE SEQUENCE {seq_name} START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
            EXCEPTION
                WHEN OTHERS THEN
                    IF SQLCODE != -955 THEN
                        RAISE;
                    END IF;
            END;
        """)
        connection.commit()
    finally:
        cursor.close()

async def check_and_create_users_table():
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT table_name FROM user_tables WHERE table_name = 'USERS'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            await create_users_table()
            return
        
        required_columns = [
            'ID', 'NAME', 'EMAIL', 'PASSWORD', 'DATE_OF_BIRTH',
            'IS_ACTIVE', 'LAST_LOGIN', 'CREATED_AT'
        ]
        
        cursor.execute("SELECT column_name FROM user_tab_columns WHERE table_name = 'USERS'")
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        missing_columns = [col for col in required_columns if col not in existing_columns]
        
        if missing_columns:
            print(f"Missing columns in USERS table: {', '.join(missing_columns)}")
            print("Dropping and recreating USERS table...")
            cursor.execute('DROP TABLE users CASCADE CONSTRAINTS')
            await create_users_table()
        else:
            print("USERS table exists with all required columns")
    except Exception as error:
        print(f"Error checking/creating users table: {error}")
        raise error
    finally:
        cursor.close()

async def create_users_table():
    cursor = connection.cursor()
    try:
        cursor.execute("""
            CREATE TABLE users (
                id NUMBER PRIMARY KEY,
                name VARCHAR2(100) NOT NULL,
                email VARCHAR2(255) UNIQUE NOT NULL,
                password VARCHAR2(255) NOT NULL,
                date_of_birth DATE NOT NULL,
                is_active NUMBER(1) DEFAULT 1,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        connection.commit()
        print("Created USERS table")
    finally:
        cursor.close()

# Similar functions for transactions and goals
async def check_and_create_transactions_table():
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT table_name FROM user_tables WHERE table_name = 'TRANSACTIONS'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            await create_transactions_table()
            return
        
        required_columns = [
            'ID', 'AMOUNT', 'DESCRIPTION', 'TYPE', 'CATEGORY',
            'USER_ID', 'DATE_CREATED', 'TRANSACTION_DATE'
        ]
        
        cursor.execute("SELECT column_name FROM user_tab_columns WHERE table_name = 'TRANSACTIONS'")
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        missing_columns = [col for col in required_columns if col not in existing_columns]
        
        if missing_columns:
            print(f"Missing columns in TRANSACTIONS table: {', '.join(missing_columns)}")
            print("Dropping and recreating TRANSACTIONS table...")
            cursor.execute('DROP TABLE transactions CASCADE CONSTRAINTS')
            await create_transactions_table()
        else:
            print("TRANSACTIONS table exists with all required columns")
            
            cursor.execute("""
                SELECT constraint_name
                FROM user_constraints
                WHERE table_name = 'TRANSACTIONS'
                AND constraint_name = 'FK_USER_TRANSACTION'
            """)
            fk_exists = cursor.fetchone()
            
            if not fk_exists:
                print("Adding foreign key constraint...")
                cursor.execute("""
                    ALTER TABLE transactions
                    ADD CONSTRAINT fk_user_transaction
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                """)
                connection.commit()
    except Exception as error:
        print(f"Error checking/creating transactions table: {error}")
        raise error
    finally:
        cursor.close()

async def create_transactions_table():
    cursor = connection.cursor()
    try:
        cursor.execute("""
            CREATE TABLE transactions (
                id NUMBER PRIMARY KEY,
                amount NUMBER NOT NULL,
                description VARCHAR2(500) NOT NULL,
                type VARCHAR2(10) NOT NULL,
                category VARCHAR2(100) NOT NULL,
                user_id NUMBER NOT NULL,
                date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                transaction_date DATE NOT NULL,
                CONSTRAINT fk_user_transaction FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        connection.commit()
        print("Created TRANSACTIONS table with foreign key constraint")
    finally:
        cursor.close()

async def check_and_create_goals_table():
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT table_name FROM user_tables WHERE table_name = 'GOALS'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            await create_goals_table()
            return
        
        print("GOALS table already exists")
    except Exception as error:
        print(f"Error checking/creating goals table: {error}")
        raise error
    finally:
        cursor.close()

async def create_goals_table():
    cursor = connection.cursor()
    try:
        cursor.execute("""
            CREATE TABLE goals (
                id NUMBER PRIMARY KEY,
                user_id NUMBER NOT NULL,
                target_amount NUMBER NOT NULL,
                target_month NUMBER NOT NULL,
                target_year NUMBER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_user_goal FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT unique_user_month_goal UNIQUE (user_id, target_month, target_year)
            )
        """)
        connection.commit()
        print("Created GOALS table")
    finally:
        cursor.close()

async def get_connection():
    global connection
    if not connection:
        connection = oracledb.connect(**db_config)
    return connection

async def close_connection():
    if connection:
        connection.close()
        print("Database connection closed")