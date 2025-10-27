from app.config.database import get_connection

class Transaction:
    @staticmethod
    async def create(transaction_data):
        conn = await get_connection()
        cursor = conn.cursor()
        try:
            amount = transaction_data['amount']
            description = transaction_data['description']
            type_ = transaction_data['type']
            category = transaction_data['category']
            user_id = transaction_data['user_id']
            transaction_date = transaction_data['transaction_date']
            
            cursor.execute("SELECT transactions_seq.NEXTVAL AS id FROM DUAL")
            next_id = cursor.fetchone()[0]
            
            cursor.execute("""
                INSERT INTO transactions (id, amount, description, type, category, user_id, transaction_date)
                VALUES (:id, :amount, :description, :type, :category, :user_id, TO_DATE(:transaction_date, 'YYYY-MM-DD'))
            """, {
                "id": next_id,
                "amount": amount,
                "description": description,
                "type": type_,
                "category": category,
                "user_id": user_id,
                "transaction_date": transaction_date
            })
            conn.commit()
            return next_id
        finally:
            cursor.close()

    @staticmethod
    async def get_all(user_id):
        conn = await get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                SELECT id, amount, description, type, category,
                       TO_CHAR(date_created, 'YYYY-MM-DD"T"HH24:MI:SS.FF3') as date_created,
                       TO_CHAR(transaction_date, 'YYYY-MM-DD') as transaction_date
                FROM transactions
                WHERE user_id = :user_id
                ORDER BY transaction_date DESC, date_created DESC
            """, {"user_id": user_id})
            rows = cursor.fetchall()
            return [{
                "id": row[0],
                "amount": float(row[1]),
                "desc": row[2],
                "type": row[3],
                "category": row[4],
                "date": row[6],
                "date_created": row[5]
            } for row in rows]
        finally:
            cursor.close()

    @staticmethod
    async def get_by_id(id_, user_id):
        conn = await get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                SELECT id, amount, description, type, category,
                       TO_CHAR(date_created, 'YYYY-MM-DD"T"HH24:MI:SS.FF3') as date_created,
                       TO_CHAR(transaction_date, 'YYYY-MM-DD') as transaction_date
                FROM transactions
                WHERE id = :id AND user_id = :user_id
            """, {"id": id_, "user_id": user_id})
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "id": row[0],
                "amount": float(row[1]),
                "desc": row[2],
                "type": row[3],
                "category": row[4],
                "date": row[6],
                "date_created": row[5]
            }
        finally:
            cursor.close()

    @staticmethod
    async def get_by_month(user_id, month, year):
        conn = await get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                SELECT id, amount, description, type, category,
                       TO_CHAR(date_created, 'YYYY-MM-DD"T"HH24:MI:SS.FF3') as date_created,
                       TO_CHAR(transaction_date, 'YYYY-MM-DD') as transaction_date
                FROM transactions
                WHERE user_id = :user_id
                AND EXTRACT(MONTH FROM transaction_date) = :month
                AND EXTRACT(YEAR FROM transaction_date) = :year
                ORDER BY transaction_date DESC
            """, {"user_id": user_id, "month": month, "year": year})
            rows = cursor.fetchall()
            return [{
                "id": row[0],
                "amount": float(row[1]),
                "desc": row[2],
                "type": row[3],
                "category": row[4],
                "date": row[6],
                "date_created": row[5]
            } for row in rows]
        finally:
            cursor.close()

    @staticmethod
    async def delete(id_, user_id):
        conn = await get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                DELETE FROM transactions WHERE id = :id AND user_id = :user_id
            """, {"id": id_, "user_id": user_id})
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()

    @staticmethod
    async def update(id_, transaction_data, user_id):
        conn = await get_connection()
        cursor = conn.cursor()
        try:
            amount = transaction_data['amount']
            description = transaction_data['description']
            type_ = transaction_data['type']
            category = transaction_data['category']
            transaction_date = transaction_data['transaction_date']
            
            cursor.execute("""
                UPDATE transactions
                SET amount = :amount, description = :description, type = :type, category = :category,
                    transaction_date = TO_DATE(:transaction_date, 'YYYY-MM-DD')
                WHERE id = :id AND user_id = :user_id
            """, {
                "amount": amount,
                "description": description,
                "type": type_,
                "category": category,
                "transaction_date": transaction_date,
                "id": id_,
                "user_id": user_id
            })
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()