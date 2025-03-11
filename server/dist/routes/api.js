"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dbclient_1 = require("../dbclient");
const router = express_1.default.Router();
// Get all buildings
router.get('/buildings', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, dbclient_1.query)('SELECT * FROM buildings ORDER BY "createdAt" DESC');
        console.log(result.rows);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error fetching buildings:', err);
        res.status(500).json({ error: 'Failed to fetch buildings' });
    }
}));
// Get a specific building by ID
router.get('/buildings/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, dbclient_1.query)('SELECT * FROM buildings WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Building not found' });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error fetching building:', err);
        res.status(500).json({ error: 'Failed to fetch building' });
    }
}));
// Create a new building
router.post('/buildings', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, title, designer, year, neighbourhood, era, xcoordinate, ycoordinate } = req.body;
        // Validate required fields
        if (!id || !title || !designer || !year || !neighbourhood || !era || xcoordinate === undefined || ycoordinate === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const result = yield (0, dbclient_1.query)('INSERT INTO buildings (id,  title, designer, year, neighbourhood, era, xcoordinate, ycoordinate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [id, title, designer, year, neighbourhood, era, xcoordinate, ycoordinate]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Error creating building:', err);
        res.status(500).json({ error: 'Failed to create building' });
    }
}));
// Get all impressions for a building
router.get('/buildings/:id/impressions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, dbclient_1.query)('SELECT * FROM impressions WHERE "buildingId" = $1 ORDER BY "createdAt" DESC', [id]);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error fetching impressions:', err);
        res.status(500).json({ error: 'Failed to fetch impressions' });
    }
}));
// Create a new impression for a building
router.post('/buildings/:id/impressions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: buildingId } = req.params;
        const { content, moods, photos, hyperlinks, id: impressionId } = req.body;
        // Validate required fields
        if (!content || !moods || !buildingId || !impressionId) {
            return res.status(400).json({ error: 'Content is required' });
        }
        // Check if building exists
        const buildingCheck = yield (0, dbclient_1.query)('SELECT id FROM buildings WHERE id = $1', [buildingId]);
        if (buildingCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Building not found' });
        }
        // Insert the impression
        const result = yield (0, dbclient_1.query)('INSERT INTO impressions (id, "buildingId", content, moods, photos, hyperlinks) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [impressionId, buildingId, content, `{${moods.join(',')}}`, `{${photos.join(',')}}`, `{${hyperlinks.join(',')}}`]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Error creating impression:', err);
        res.status(500).json({ error: 'Failed to create impression' });
    }
}));
exports.default = router;
