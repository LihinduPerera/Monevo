const { getConnection } = require('../config/database');

class Transaction {
  static async create(transactionData) {
    const connection = await getConnection();
    const { amount, description, type, category } = transactionData;
    
    const result = await connection.execute(
      `INSERT INTO transactions (amount, description, type, category) 
       VALUES (:amount, :description, :type, :category) 
       RETURNING id INTO :id`,
      {
        amount,
        description,
        type,
        category,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      }
    );
    
    return result.outBinds.id[0];
  }

  static async getAll() {
    const connection = await getConnection();
    const result = await connection.execute(
      `SELECT id, amount, description, type, category, 
              TO_CHAR(date_created, 'YYYY-MM-DD HH24:MI:SS') as date 
       FROM transactions 
       ORDER BY date_created DESC`
    );
    
    return result.rows.map(row => ({
      id: row.ID,
      amount: row.AMOUNT,
      desc: row.DESCRIPTION,
      type: row.TYPE,
      category: row.CATEGORY,
      date: row.DATE
    }));
  }

  static async getById(id) {
    const connection = await getConnection();
    const result = await connection.execute(
      `SELECT id, amount, description, type, category, 
              TO_CHAR(date_created, 'YYYY-MM-DD HH24:MI:SS') as date 
       FROM transactions 
       WHERE id = :id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.ID,
      amount: row.AMOUNT,
      desc: row.DESCRIPTION,
      type: row.TYPE,
      category: row.CATEGORY,
      date: row.DATE
    };
  }

  static async delete(id) {
    const connection = await getConnection();
    const result = await connection.execute(
      'DELETE FROM transactions WHERE id = :id',
      [id]
    );
    
    return result.rowsAffected > 0;
  }

  static async update(id, transactionData) {
    const connection = await getConnection();
    const { amount, description, type, category } = transactionData;
    
    const result = await connection.execute(
      `UPDATE transactions 
       SET amount = :amount, description = :description, type = :type, category = :category 
       WHERE id = :id`,
      { amount, description, type, category, id }
    );
    
    return result.rowsAffected > 0;
  }
}

module.exports = Transaction;