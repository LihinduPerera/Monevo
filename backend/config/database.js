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

    // Check and create users table
    await checkAndCreateUsersTable();
    
    // Check and create transactions table
    await checkAndCreateTransactionsTable();
    
    console.log('Database initialized successfully');
    return connection;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Function to check and create users table
const checkAndCreateUsersTable = async () => {
  try {
    // Check if users table exists
    const tableExists = await connection.execute(`
      SELECT table_name 
      FROM user_tables 
      WHERE table_name = 'USERS'
    `);

    if (tableExists.rows.length === 0) {
      // Table doesn't exist, create it
      await createUsersTable();
      return;
    }

    // Table exists, check if all required columns are present
    const requiredColumns = [
      'ID', 'NAME', 'EMAIL', 'PASSWORD', 'DATE_OF_BIRTH', 
      'IS_ACTIVE', 'LAST_LOGIN', 'CREATED_AT'
    ];

    const existingColumns = await connection.execute(`
      SELECT column_name 
      FROM user_tab_columns 
      WHERE table_name = 'USERS'
    `);

    const existingColumnNames = existingColumns.rows.map(row => row.COLUMN_NAME);
    const missingColumns = requiredColumns.filter(col => !existingColumnNames.includes(col));

    if (missingColumns.length > 0) {
      console.log(`Missing columns in USERS table: ${missingColumns.join(', ')}`);
      console.log('Dropping and recreating USERS table...');
      
      // Drop and recreate the table
      await connection.execute('DROP TABLE users CASCADE CONSTRAINTS');
      await createUsersTable();
    } else {
      console.log('USERS table exists with all required columns');
    }

  } catch (error) {
    console.error('Error checking/creating users table:', error);
    throw error;
  }
};

// Function to create users table
const createUsersTable = async () => {
  await connection.execute(`
    CREATE TABLE users (
      id NUMBER PRIMARY KEY,
      name VARCHAR2(100) NOT NULL,
      email VARCHAR2(255) UNIQUE NOT NULL,
      password VARCHAR2(255) NOT NULL,
      date_of_birth DATE NOT NULL,
      is_active NUMBER(1) DEFAULT 1,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Created USERS table');
};

// Function to check and create transactions table
const checkAndCreateTransactionsTable = async () => {
  try {
    // Check if transactions table exists
    const tableExists = await connection.execute(`
      SELECT table_name 
      FROM user_tables 
      WHERE table_name = 'TRANSACTIONS'
    `);

    if (tableExists.rows.length === 0) {
      // Table doesn't exist, create it
      await createTransactionsTable();
      return;
    }

    // Table exists, check if all required columns are present
    const requiredColumns = [
      'ID', 'AMOUNT', 'DESCRIPTION', 'TYPE', 'CATEGORY', 
      'USER_ID', 'DATE_CREATED'
    ];

    const existingColumns = await connection.execute(`
      SELECT column_name 
      FROM user_tab_columns 
      WHERE table_name = 'TRANSACTIONS'
    `);

    const existingColumnNames = existingColumns.rows.map(row => row.COLUMN_NAME);
    const missingColumns = requiredColumns.filter(col => !existingColumnNames.includes(col));

    if (missingColumns.length > 0) {
      console.log(`Missing columns in TRANSACTIONS table: ${missingColumns.join(', ')}`);
      console.log('Dropping and recreating TRANSACTIONS table...');
      
      // Drop and recreate the table
      await connection.execute('DROP TABLE transactions CASCADE CONSTRAINTS');
      await createTransactionsTable();
    } else {
      console.log('TRANSACTIONS table exists with all required columns');
      
      // Check if foreign key constraint exists
      try {
        const fkExists = await connection.execute(`
          SELECT constraint_name 
          FROM user_constraints 
          WHERE table_name = 'TRANSACTIONS' 
          AND constraint_name = 'FK_USER_TRANSACTION'
        `);
        
        if (fkExists.rows.length === 0) {
          console.log('Adding foreign key constraint...');
          await connection.execute(`
            ALTER TABLE transactions 
            ADD CONSTRAINT fk_user_transaction 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          `);
        }
      } catch (fkError) {
        console.log('Error checking/adding foreign key:', fkError.message);
      }
    }

  } catch (error) {
    console.error('Error checking/creating transactions table:', error);
    throw error;
  }
};

// Function to create transactions table
const createTransactionsTable = async () => {
  await connection.execute(`
    CREATE TABLE transactions (
      id NUMBER PRIMARY KEY,
      amount NUMBER NOT NULL,
      description VARCHAR2(500) NOT NULL,
      type VARCHAR2(10) NOT NULL,
      category VARCHAR2(100) NOT NULL,
      user_id NUMBER NOT NULL,
      date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_transaction FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Created TRANSACTIONS table with foreign key constraint');
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