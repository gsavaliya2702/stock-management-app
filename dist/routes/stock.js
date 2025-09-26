"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const StockItem_1 = __importDefault(require("../models/StockItem"));
const Product_1 = __importDefault(require("../models/Product"));
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// Get all stock items with product info
router.get('/', async (req, res) => {
    try {
        const stockItems = await StockItem_1.default.find();
        const stockWithProducts = await Promise.all(stockItems.map(async (item) => {
            const product = await Product_1.default.findById(item.productId);
            return {
                ...item.toObject(),
                product
            };
        }));
        res.json(stockWithProducts);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Get stock item by product ID
router.get('/product/:productId', async (req, res) => {
    try {
        const stockItem = await StockItem_1.default.findOne({ productId: req.params.productId });
        if (!stockItem) {
            return res.status(404).json({ message: 'Stock item not found' });
        }
        res.json(stockItem);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Update stock quantity with validation
router.put('/product/:productId', (0, validation_1.validate)(validation_1.stockValidationSchemas.update), async (req, res) => {
    try {
        const { quantity } = req.body;
        const productId = req.params.productId;
        // Update StockItem
        const stockItem = await StockItem_1.default.findOneAndUpdate({ productId }, {
            quantity,
            lastUpdated: new Date()
        }, { new: true, upsert: true });
        // Also update Product.stockQuantity
        await Product_1.default.findByIdAndUpdate(productId, {
            stockQuantity: quantity,
            updatedAt: new Date()
        });
        res.json(stockItem);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// Add stock (increment) with validation
router.post('/add/:productId', (0, validation_1.validate)(validation_1.stockValidationSchemas.add), async (req, res) => {
    try {
        const { quantity } = req.body;
        const productId = req.params.productId;
        // Get the current product stock quantity
        const product = await Product_1.default.findById(productId);
        let currentProductStock = product ? product.stockQuantity || 0 : 0;
        const stockItem = await StockItem_1.default.findOne({ productId });
        if (stockItem) {
            stockItem.quantity += quantity;
            stockItem.lastUpdated = new Date();
            await stockItem.save();
        }
        else {
            const newStockItem = new StockItem_1.default({
                productId,
                quantity,
                lastUpdated: new Date()
            });
            await newStockItem.save();
        }
        // Update Product stock quantity
        currentProductStock += quantity;
        await Product_1.default.findByIdAndUpdate(productId, {
            stockQuantity: currentProductStock,
            updatedAt: new Date()
        });
        res.json({
            message: 'Stock added successfully',
            stockItem: stockItem || { productId, quantity, lastUpdated: new Date() },
            productStock: currentProductStock
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// Remove stock (decrement) with validation
router.post('/remove/:productId', (0, validation_1.validate)(validation_1.stockValidationSchemas.remove), async (req, res) => {
    try {
        const { quantity } = req.body;
        const productId = req.params.productId;
        // Get the current product stock quantity
        const product = await Product_1.default.findById(productId);
        let currentProductStock = product ? product.stockQuantity || 0 : 0;
        const stockItem = await StockItem_1.default.findOne({ productId });
        if (!stockItem) {
            return res.status(404).json({ message: 'Stock item not found' });
        }
        if (stockItem.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }
        stockItem.quantity -= quantity;
        stockItem.lastUpdated = new Date();
        await stockItem.save();
        // Update Product stock quantity
        currentProductStock -= quantity;
        await Product_1.default.findByIdAndUpdate(productId, {
            stockQuantity: currentProductStock,
            updatedAt: new Date()
        });
        res.json({
            message: 'Stock removed successfully',
            stockItem,
            productStock: currentProductStock
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.default = router;
