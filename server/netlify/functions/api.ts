import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import serverless from "serverless-http";

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
async function query(text: string, params?: any[]) {
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


const router = express.Router();

// Get all buildings
router.get('/buildings', async (req, res) => {
  try {
    const result = await query('SELECT * FROM "public"."buildings" ORDER BY "createdAt" DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching buildings:', err);
    res.status(500).json({ error: 'Failed to fetch buildings' });
  }
});

// Get a specific building by ID
router.get('/buildings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM "public"."buildings" WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching building:', err);
    res.status(500).json({ error: 'Failed to fetch building' });
  }
});

// Create a new building
router.post('/buildings', async (req, res) => {
  try {
    const { id, title, designer, year, neighbourhood, era, xcoordinate, ycoordinate } = req.body;
    
    // Validate required fields
    if (!id || !title || !designer || !year || !neighbourhood || !era || xcoordinate === undefined || ycoordinate === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await query(
      'INSERT INTO "public"."buildings" (id,  title, designer, year, neighbourhood, era, xcoordinate, ycoordinate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, title, designer, year, neighbourhood, era, xcoordinate, ycoordinate]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating building:', err);
    res.status(500).json({ error: 'Failed to create building' });
  }
});

// Get all impressions for a building
router.get('/buildings/:id/impressions', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM "public"."impressions" WHERE "buildingId" = $1 ORDER BY "createdAt" DESC', [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching impressions:', err);
    res.status(500).json({ error: 'Failed to fetch impressions' });
  }
});

// Create a new impression for a building
router.post('/buildings/:id/impressions', async (req, res) => {
  try {
    const { id: buildingId } = req.params;
    const { content, moods, photos, hyperlinks, id: impressionId } = req.body;
    
    // Validate required fields
    if (!content || !moods || !buildingId || !impressionId) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Check if building exists
    const buildingCheck = await query('SELECT id FROM "public"."buildings" WHERE id = $1', [buildingId]);
    if (buildingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }
    
    // Insert the impression
    const result = await query(
      'INSERT INTO "public"."impressions" (id, "buildingId", content, moods, photos, hyperlinks) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [impressionId, buildingId, content, `{${moods.join(',')}}`, `{${photos.join(',')}}`, `{${hyperlinks.join(',')}}`]
    );
      
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating impression:', err);
    res.status(500).json({ error: 'Failed to create impression' });
  }
});

router.get('/designers', async (req, res) => {
  try {
    const result = await query(`
      SELECT DISTINCT LOWER(designer) as designer 
      FROM "public"."buildings" 
      ORDER BY LOWER(designer) ASC
    `);
    res.json(result.rows.map(row => row.designer));
  } catch (err) {
    console.error('Error fetching designers:', err);
    res.status(500).json({ error: 'Failed to fetch designers' });
  }
});


// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

app.use(cors({
    origin: process.env.NODE_ENV !== 'development' 
      ? 'https://buildings-of-berlin-fe.netlify.app'
      : 'http://localhost:8080'
  }));

// Connect API routes
app.use('/api', router);

app.get('/', (req, res) => {
  res.send('Hello World');
});

// Remove the app.listen part and export the handler
export const handler = serverless(app);