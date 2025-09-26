"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Supplier_1 = __importDefault(require("../models/Supplier"));
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// Get all suppliers
router.get('/', async (req, res) => {
    try {
        const suppliers = await Supplier_1.default.find();
        res.json(suppliers);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Get supplier by ID
router.get('/:id', async (req, res) => {
    try {
        const supplier = await Supplier_1.default.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.json(supplier);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Create supplier with validation
router.post('/', (0, validation_1.validate)(validation_1.supplierValidationSchemas.create), async (req, res) => {
    try {
        const supplier = new Supplier_1.default(req.body);
        const savedSupplier = await supplier.save();
        res.status(201).json(savedSupplier);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// Update supplier with validation
router.put('/:id', (0, validation_1.validate)(validation_1.supplierValidationSchemas.update), async (req, res) => {
    try {
        const supplier = await Supplier_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.json(supplier);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// Delete supplier
router.delete('/:id', async (req, res) => {
    try {
        const supplier = await Supplier_1.default.findByIdAndDelete(req.params.id);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.json({ message: 'Supplier deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.default = router;
