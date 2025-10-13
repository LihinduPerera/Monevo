const { getConnection } = require('../config/database');

class Goal {
  static async create(goalData) {
    const connection = await getConnection();
    const { user_id, target_amount, target_month, target_year } = goalData;
    
    try {
      // Get next sequence value
      const seqResult = await connection.execute(
        'SELECT goals_seq.NEXTVAL AS id FROM DUAL'
      );
      const nextId = seqResult.rows[0].ID;

      // Insert goal
      await connection.execute(
        `INSERT INTO goals (id, user_id, target_amount, target_month, target_year) 
         VALUES (:id, :user_id, :target_amount, :target_month, :target_year)`,
        {
          id: nextId,
          user_id: user_id,
          target_amount: target_amount,
          target_month: target_month,
          target_year: target_year
        },
        { autoCommit: true }
      );
      
      return nextId;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  static async getByUserAndMonth(userId, month, year) {
    const connection = await getConnection();
    try {
      const result = await connection.execute(
        `SELECT id, target_amount, target_month, target_year,
                TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.FF3') as created_at 
         FROM goals 
         WHERE user_id = :user_id AND target_month = :target_month AND target_year = :target_year`,
        [userId, month, year]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.ID,
        target_amount: parseFloat(row.TARGET_AMOUNT),
        target_month: row.TARGET_MONTH,
        target_year: row.TARGET_YEAR,
        created_at: row.CREATED_AT
      };
    } catch (error) {
      console.error('Error getting goal by user and month:', error);
      throw error;
    }
  }

  static async getUserGoals(userId) {
    const connection = await getConnection();
    try {
      const result = await connection.execute(
        `SELECT id, target_amount, target_month, target_year,
                TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.FF3') as created_at 
         FROM goals 
         WHERE user_id = :user_id
         ORDER BY target_year DESC, target_month DESC`,
        [userId]
      );
      
      return result.rows.map(row => ({
        id: row.ID,
        target_amount: parseFloat(row.TARGET_AMOUNT),
        target_month: row.TARGET_MONTH,
        target_year: row.TARGET_YEAR,
        created_at: row.CREATED_AT
      }));
    } catch (error) {
      console.error('Error getting user goals:', error);
      throw error;
    }
  }

  static async update(id, goalData, userId) {
    const connection = await getConnection();
    const { target_amount, target_month, target_year } = goalData;
    
    try {
      const result = await connection.execute(
        `UPDATE goals 
         SET target_amount = :target_amount, target_month = :target_month, target_year = :target_year
         WHERE id = :id AND user_id = :user_id`,
        { 
          target_amount: target_amount, 
          target_month: target_month, 
          target_year: target_year, 
          id: id,
          user_id: userId
        },
        { autoCommit: true }
      );
      
      return result.rowsAffected > 0;
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  }

  static async delete(id, userId) {
    const connection = await getConnection();
    try {
      const result = await connection.execute(
        'DELETE FROM goals WHERE id = :id AND user_id = :user_id',
        [id, userId],
        { autoCommit: true }
      );
      
      return result.rowsAffected > 0;
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }
}

module.exports = Goal;