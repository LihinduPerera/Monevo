const { getConnection } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async create(userData) {
    const connection = await getConnection();
    const { name, email, password, date_of_birth } = userData;
    
    try {

      const existingUser = await connection.execute(
        'SELECT id FROM users WHERE email = :email',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User with this email already exists');
      }

      
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      
      const seqResult = await connection.execute(
        'SELECT users_seq.NEXTVAL AS id FROM DUAL'
      );
      const nextId = seqResult.rows[0].ID;

      
      await connection.execute(
        `INSERT INTO users (id, name, email, password, date_of_birth, is_active) 
         VALUES (:id, :name, :email, :password, TO_DATE(:date_of_birth, 'YYYY-MM-DD'), :is_active)`,
        {
          id: nextId,
          name: name,
          email: email,
          password: hashedPassword,
          date_of_birth: date_of_birth,
          is_active: 1
        },
        { autoCommit: true }
      );
      
      return nextId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getById(id) {
    const connection = await getConnection();
    try {
      const result = await connection.execute(
        `SELECT id, name, email, date_of_birth, is_active,
                TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.FF3') as created_at 
         FROM users 
         WHERE id = :id`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.ID,
        name: row.NAME,
        email: row.EMAIL,
        date_of_birth: row.DATE_OF_BIRTH,
        is_active: row.IS_ACTIVE === 1,
        created_at: row.CREATED_AT
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  static async getByEmail(email) {
    const connection = await getConnection();
    try {
      const result = await connection.execute(
        `SELECT id, name, email, password, date_of_birth, is_active,
                TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.FF3') as created_at 
         FROM users 
         WHERE email = :email`,
        [email]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.ID,
        name: row.NAME,
        email: row.EMAIL,
        password: row.PASSWORD,
        date_of_birth: row.DATE_OF_BIRTH,
        is_active: row.IS_ACTIVE === 1,
        created_at: row.CREATED_AT
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  static async updateLastLogin(userId) {
    const connection = await getConnection();
    try {
      await connection.execute(
        `UPDATE users 
         SET last_login = CURRENT_TIMESTAMP 
         WHERE id = :id`,
        [userId],
        { autoCommit: true }
      );
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;