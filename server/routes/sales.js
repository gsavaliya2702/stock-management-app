import express from 'express';

const router = express.Router();

// Get all sales
router.get('/', async (req, res) => {
  try {
    // Placeholder response
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create sale
router.post('/', async (req, res) => {
  try {
    // Placeholder response
    res.status(201).json(req.body);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;