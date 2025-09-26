"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Category_1 = __importDefault(require("../models/Category"));
const router = express_1.default.Router();
// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category_1.default.find();
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Get category by ID
router.get('/:id', async (req, res) => {
    try {
        const category = await Category_1.default.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Create category
router.post('/', async (req, res) => {
    try {
        const category = new Category_1.default({
            category_name: req.body.category_name
        });
        const newCategory = await category.save();
        res.status(201).json(newCategory);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// Update category
router.put('/:id', async (req, res) => {
    try {
        const category = await Category_1.default.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        if (req.body.category_name) {
            category.category_name = req.body.category_name;
        }
        const updatedCategory = await category.save();
        res.json(updatedCategory);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// Delete category
router.delete('/:id', async (req, res) => {
    try {
        const category = await Category_1.default.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        // Check if category is in use by any products
        const Product = require('../models/Product').default;
        const products = await Product.find({ categoryId: req.params.id });
        if (products.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete category that is in use by products',
                productCount: products.length
            });
        }
        await category.deleteOne();
        res.json({ message: 'Category deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.default = router;
