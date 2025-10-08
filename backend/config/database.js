const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SID}`
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
  if (!connection) {
    connection = await oracledb.getConnection(dbConfig);
  }
  return connection;
};

const closeConnection = async () => {
  if (connection) {
    await connection.close();
    console.log('Database connection closed');
  }
};

module.exports = {
  initDatabase,
  getConnection,
  closeConnection
};