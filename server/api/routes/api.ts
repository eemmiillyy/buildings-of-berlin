import express from 'express';
import { query } from '../dbclient';

const router = express.Router();

// Get all buildings
router.get('/buildings', async (req, res) => {
  try {
    const result = await query('SELECT * FROM buildings ORDER BY "createdAt" DESC');
    console.log(result.rows);
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
    const result = await query('SELECT * FROM buildings WHERE id = $1', [id]);
    
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
      'INSERT INTO buildings (id,  title, designer, year, neighbourhood, era, xcoordinate, ycoordinate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
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
    const result = await query('SELECT * FROM impressions WHERE "buildingId" = $1 ORDER BY "createdAt" DESC', [id]);
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
    const buildingCheck = await query('SELECT id FROM buildings WHERE id = $1', [buildingId]);
    if (buildingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }
    
    // Insert the impression
    const result = await query(
      'INSERT INTO impressions (id, "buildingId", content, moods, photos, hyperlinks) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [impressionId, buildingId, content, `{${moods.join(',')}}`, `{${photos.join(',')}}`, `{${hyperlinks.join(',')}}`]
    );
      
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating impression:', err);
    res.status(500).json({ error: 'Failed to create impression' });
  }
});

// Add this new endpoint to get unique designers
router.get('/designers', async (req, res) => {
  try {
    const result = await query(`
      SELECT DISTINCT LOWER(designer) as designer 
      FROM buildings 
      ORDER BY LOWER(designer) ASC
    `);
    res.json(result.rows.map(row => row.designer));
  } catch (err) {
    console.error('Error fetching designers:', err);
    res.status(500).json({ error: 'Failed to fetch designers' });
  }
});

export default router; 