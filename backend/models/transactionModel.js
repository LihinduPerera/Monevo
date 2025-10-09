const { getConnection } = require('../config/database');

class Transaction {
  static async create(transactionData) {
    const connection = await getConnection();
    const { amount, description, type, category } = transactionData;
    
    try {
      // Get next sequence value
      const seqResult = await connection.execute(
        'SELECT transactions_seq.NEXTVAL AS id FROM DUAL'
      );
      const nextId = seqResult.rows[0].ID;

      // Insert with explicit ID from sequence
      await connection.execute(
        `INSERT INTO transactions (id, amount, description, type, category) 
         VALUES (:id, :amount, :description, :type, :category)`,
        {
          id: nextId,
          amount: amount,
          description: description,
          type: type,
          category: category
        },
        { autoCommit: true }
      );
      
      return nextId;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  static async getAll() {
    const connection = await getConnection();
    try {
      const result = await connection.execute(
        `SELECT id, amount, description, type, category, 
                TO_CHAR(date_created, 'YYYY-MM-DD"T"HH24:MI:SS.FF3') as date 
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
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }

  static async getById(id) {
    const connection = await getConnection();
    try {
      const result = await connection.execute(
        `SELECT id, amount, description, type, category, 
                TO_CHAR(date_created, 'YYYY-MM-DD"T"HH24:MI:SS.FF3') as date 
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
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      throw error;
    }
  }

  static async delete(id) {
    const connection = await getConnection();
    try {
      const result = await connection.execute(
        'DELETE FROM transactions WHERE id = :id',
        [id],
        { autoCommit: true }
      );
      
      return result.rowsAffected > 0;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  static async update(id, transactionData) {
    const connection = await getConnection();
    const { amount, description, type, category } = transactionData;
    
    try {
      const result = await connection.execute(
        `UPDATE transactions 
         SET amount = :amount, description = :description, type = :type, category = :category 
         WHERE id = :id`,
        { 
          amount: amount, 
          description: description, 
          type: type, 
          category: category, 
          id: id 
        },
        { autoCommit: true }
      );
      
      return result.rowsAffected > 0;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }
}

module.exports = Transaction;