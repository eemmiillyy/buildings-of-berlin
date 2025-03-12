import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Check if the database URL is defined
if (!process.env.DB_URL) {
  console.error('Database URL is not defined in .env.local file');
  process.exit(1);
}

// Create a new pool using the connection string from .env.local
const url = new URL(process.env.DB_URL);
const host = url.hostname;
const database = url.pathname.slice(1);
const port = url.port;
const user = url.username;
const password = url.password;

const pool = new Pool({
  host: host,
  database: database,
  port: parseInt(port ?? '5432'),
  user: user,
  password: password,
  ssl: { rejectUnauthorized: false }
});

// Test the connection
pool.connect()
  .then((client: any) => {
    console.log('Successfully connected to PostgreSQL database');
    client.release();
  })
  .catch((err: any) => {
    console.error('Error connecting to PostgreSQL database:', err);
  });

/**
 * Execute a query with parameters
 * @param text The SQL query text
 * @param params The query parameters
 * @returns Promise with the query result
 */
export async function query(text: string, params?: any[]) {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Error executing query:', err);
    throw err;
  }
}

/**
 * Get a client from the pool
 * @returns A client from the pool
 */
export async function getClient() {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  
  // Set a timeout of 5 seconds, after which we will log this client's last query
  // Add lastQuery property to client type
  const clientWithLastQuery = client as PoolClient & { lastQuery?: any };

  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
    console.error(`The last executed query on this client was: ${clientWithLastQuery.lastQuery}`);
  }, 5000);
  
  
  client.release = () => {
    // Clear the timeout
    clearTimeout(timeout);
    // Set the methods back to their old implementation
    client.query = query;
    client.release = release;
    return release.apply(client);
  };
  
  return client;
}

export default {
  query,
  getClient,
  pool
};
