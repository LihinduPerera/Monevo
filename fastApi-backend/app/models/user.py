import bcrypt
from app.config.database import get_connection

class User:
    @staticmethod
    async def create(user_data):
        conn = await get_connection()
        cursor = conn.cursor()
        try:
            name, email, password, date_of_birth = user_data['name'], user_data['email'], user_data['password'], user_data['date_of_birth']
            
            cursor.execute("SELECT id FROM users WHERE email = :email", {"email": email})
            if cursor.fetchone():
                raise ValueError("User with this email already exists")
            
            hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
            
            cursor.execute("SELECT users_seq.NEXTVAL AS id FROM DUAL")
            next_id = cursor.fetchone()[0]
            
            cursor.execute("""
                INSERT INTO users (id, name, email, password, date_of_birth, is_active)
                VALUES (:id, :name, :email, :password, TO_DATE(:date_of_birth, 'YYYY-MM-DD'), 1)
            """, {
                "id": next_id,
                "name": name,
                "email": email,
                "password": hashed_password.decode(),
                "date_of_birth": date_of_birth
            })
            conn.commit()
            return next_id
        finally:
            cursor.close()

    @staticmethod
    async def get_by_id(user_id):
        conn = await get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                SELECT id, name, email, date_of_birth, is_active,
                       TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.FF3') as created_at
                FROM users
                WHERE id = :id
            """, {"id": user_id})
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "id": row[0],
                "name": row[1],
                "email": row[2],
                "date_of_birth": row[3],
                "is_active": row[4] == 1,
                "created_at": row[5]
            }
        finally:
            cursor.close()

    @staticmethod
    async def get_by_email(email):
        conn = await get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                SELECT id, name, email, password, date_of_birth, is_active,
                       TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.FF3') as created_at
                FROM users
                WHERE email = :email
            """, {"email": email})
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "id": row[0],
                "name": row[1],
                "email": row[2],
                "password": row[3],
                "date_of_birth": row[4],
                "is_active": row[5] == 1,
                "created_at": row[6]
            }
        finally:
            cursor.close()

    @staticmethod
    async def update_last_login(user_id):
        conn = await get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE users
                SET last_login = CURRENT_TIMESTAMP
                WHERE id = :id
            """, {"id": user_id})
            conn.commit()
        finally:
            cursor.close()

    @staticmethod
    def compare_password(plain_password, hashed_password):
        return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())