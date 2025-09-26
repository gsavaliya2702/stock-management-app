import express from 'express';
import Supplier from '../models/Supplier';
import { validate, supplierValidationSchemas } from '../middleware/validation';

const router = express.Router();

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create supplier with validation
router.post('/', validate(supplierValidationSchemas.create), async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    const savedSupplier = await supplier.save();
    res.status(201).json(savedSupplier);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update supplier with validation
router.put('/:id', validate(supplierValidationSchemas.update), async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json({ message: 'Supplier deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
