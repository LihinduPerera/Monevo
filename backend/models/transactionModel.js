const { getConnection } = require('../config/database');
const oracledb = require('oracledb');

class Transaction {
  static async create(transactionData) {
    const connection = await getConnection();
    const { amount, description, type, category } = transactionData;
    
    const result = await connection.execute(
      `INSERT INTO transactions (amount, description, type, category) 
       VALUES (:amount, :description, :type, :category)`,
      { amount, description, type, category },
      { autoCommit: true }
    );
    
    // For Oracle, we need to get the last inserted ID differently
    const idResult = await connection.execute(
      'SELECT transactions_seq.CURRVAL AS id FROM DUAL'
    );
    
    return idResult.rows[0].ID;
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
      amount: parseFloat(row.AMOUNT),
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
      amount: parseFloat(row.AMOUNT),
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
      [id],
      { autoCommit: true }
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
      { amount, description, type, category, id },
      { autoCommit: true }
    );
    
    return result.rowsAffected > 0;
  }
}

module.exports = Transaction;