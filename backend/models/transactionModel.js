const { getConnection } = require('../config/database');

class Transaction {
  static async create(transactionData) {
    const connection = await getConnection();
    const { amount, description, type, category, user_id } = transactionData;
    
    try {
      // Get next sequence value
      const seqResult = await connection.execute(
        'SELECT transactions_seq.NEXTVAL AS id FROM DUAL'
      );
      const nextId = seqResult.rows[0].ID;

      // Insert with explicit ID from sequence and user_id
      await connection.execute(
        `INSERT INTO transactions (id, amount, description, type, category, user_id) 
         VALUES (:id, :amount, :description, :type, :category, :user_id)`,
        {
          id: nextId,
          amount: amount,
          description: description,
          type: type,
          category: category,
          user_id: user_id
        },
        { autoCommit: true }
      );
      
      return nextId;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  static async getAll(userId) {
    const connection = await getConnection();
    try {
      const result = await connection.execute(
        `SELECT id, amount, description, type, category, 
                TO_CHAR(date_created, 'YYYY-MM-DD"T"HH24:MI:SS.FF3') as date 
         FROM transactions 
         WHERE user_id = :user_id
         ORDER BY date_created DESC`,
        [userId]
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

  static async getById(id, userId) {
    const connection = await getConnection();
    try {
      const result = await connection.execute(
        `SELECT id, amount, description, type, category, 
                TO_CHAR(date_created, 'YYYY-MM-DD"T"HH24:MI:SS.FF3') as date 
         FROM transactions 
         WHERE id = :id AND user_id = :user_id`,
        [id, userId]
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

  static async delete(id, userId) {
    const connection = await getConnection();
    try {
      const result = await connection.execute(
        'DELETE FROM transactions WHERE id = :id AND user_id = :user_id',
        [id, userId],
        { autoCommit: true }
      );
      
      return result.rowsAffected > 0;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  static async update(id, transactionData, userId) {
    const connection = await getConnection();
    const { amount, description, type, category } = transactionData;
    
    try {
      const result = await connection.execute(
        `UPDATE transactions 
         SET amount = :amount, description = :description, type = :type, category = :category 
         WHERE id = :id AND user_id = :user_id`,
        { 
          amount: amount, 
          description: description, 
          type: type, 
          category: category, 
          id: id,
          user_id: userId
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