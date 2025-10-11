const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

const dbConfig = {
  user: process.env.DB_USER || 'system',
  password: process.env.DB_PASSWORD || '123',
  connectString: `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 1521}/${process.env.DB_SID || 'xe'}`
};

let connection;

const initDatabase = async () => {
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log('Connected to Oracle Database');
    
    // Create sequences first
    await connection.execute(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE SEQUENCE users_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN
            RAISE;
          END IF;
      END;
    `);

    await connection.execute(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE SEQUENCE transactions_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN
            RAISE;
          END IF;
      END;
    `);

    // Create users table
    await connection.execute(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE users (
          id NUMBER PRIMARY KEY,
          name VARCHAR2(100) NOT NULL,
          email VARCHAR2(255) UNIQUE NOT NULL,
          password VARCHAR2(255) NOT NULL,
          date_of_birth DATE NOT NULL,
          is_active NUMBER(1) DEFAULT 1,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN
            RAISE;
          END IF;
      END;
    `);

    // Create transactions table with user_id foreign key
    await connection.execute(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE transactions (
          id NUMBER PRIMARY KEY,
          amount NUMBER NOT NULL,
          description VARCHAR2(500) NOT NULL,
          type VARCHAR2(10) NOT NULL,
          category VARCHAR2(100) NOT NULL,
          user_id NUMBER NOT NULL,
          date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_user_transaction FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN
            RAISE;
          END IF;
      END;
    `);
    
    console.log('Database initialized successfully');
    return connection;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

const getConnection = async () => {
  try {
    if (!connection) {
      connection = await oracledb.getConnection(dbConfig);
    }
    return connection;
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }
};

const closeConnection = async () => {
  if (connection) {
    try {
      await connection.close();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing connection:', error);
    }
  }
};

module.exports = {
  initDatabase,
  getConnection,
  closeConnection
};