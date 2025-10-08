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
    
    // Create transactions table if not exists
    await connection.execute(`
      BEGIN
        EXECUTE IMMEDIATE 'CREATE TABLE transactions (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          amount NUMBER NOT NULL,
          description VARCHAR2(500) NOT NULL,
          type VARCHAR2(10) NOT NULL,
          category VARCHAR2(100) NOT NULL,
          date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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