"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const StockItem_1 = __importDefault(require("../models/StockItem"));
const Product_1 = __importDefault(require("../models/Product"));
const Sale_1 = __importDefault(require("../models/Sale"));
const Supplier_1 = __importDefault(require("../models/Supplier"));
const StockOut_1 = __importDefault(require("../models/StockOut"));
const router = express_1.default.Router();
// Get low stock alerts
router.get('/low-stock', async (req, res) => {
    try {
        const lowStockItems = await StockItem_1.default.find({ $expr: { $lte: ['$quantity', '$minStockLevel'] } });
        const alerts = (await Promise.all(lowStockItems.map(async (item) => {
            console.log('Fetching product with ID:', item.productId); // Log the product ID being fetched
            if (!item.productId || !mongoose_1.default.Types.ObjectId.isValid(item.productId)) {
                console.warn('Invalid productId:', item.productId);
                return null;
            }
            const product = await Product_1.default.findById(item.productId);
            if (!product) {
                console.warn('Product not found for ID:', item.productId);
                return null;
            }
            return {
                productId: item.productId,
                productName: product.name,
                currentStock: item.quantity,
                minStockLevel: item.minStockLevel
            };
        }))).filter(Boolean);
        res.json(alerts);
    }
    catch (error) {
        console.error('Error fetching low stock alerts:', error);
        res.status(500).json({ message: error.message });
    }
});
// Get stock value
router.get('/stock-value', async (req, res) => {
    try {
        const stockItems = await StockItem_1.default.find();
        let totalValue = 0;
        for (const item of stockItems) {
            console.log('Fetching product with ID:', item.productId); // Log the product ID being fetched
            if (!item.productId || !mongoose_1.default.Types.ObjectId.isValid(item.productId)) {
                console.warn('Invalid productId in stock value calculation:', item.productId);
                continue;
            }
            const product = await Product_1.default.findById(item.productId);
            if (product) {
                // Type assertion to access pricePerUnit property
                const productData = product;
                totalValue += item.quantity * (productData.pricePerUnit || 0);
            }
            else {
                console.warn('Product not found for ID:', item.productId);
            }
        }
        res.json({ totalValue });
    }
    catch (error) {
        console.error('Error fetching stock value:', error);
        res.status(500).json({ message: error.message });
    }
});
// Get total sales
router.get('/total-sales', async (req, res) => {
    try {
        // Get sales from the legacy Sale model
        const legacySales = await Sale_1.default.find();
        const legacyTotalSales = legacySales.reduce((sum, sale) => sum + sale.totalPrice, 0);
        // Get sales from the new StockOut model
        const stockOuts = await StockOut_1.default.find()
            .populate('product_id', 'pricePerUnit');
        const stockOutTotalSales = stockOuts.reduce((sum, stockOut) => {
            const product = stockOut.product_id;
            const pricePerUnit = product.pricePerUnit || 0;
            return sum + (pricePerUnit * stockOut.quantity);
        }, 0);
        const totalSales = legacyTotalSales + stockOutTotalSales;
        console.log('Total sales calculation:', {
            legacySales: legacyTotalSales,
            stockOutSales: stockOutTotalSales,
            total: totalSales
        });
        res.json({ totalSales });
    }
    catch (error) {
        console.error('Error fetching total sales:', error);
        res.status(500).json({ message: error.message });
    }
});
// Get supplier performance scores
router.get('/supplier-performance', async (req, res) => {
    try {
        const suppliers = await Supplier_1.default.find();
        res.json(suppliers);
    }
    catch (error) {
        console.error('Error fetching supplier performance:', error);
        res.status(500).json({ message: error.message });
    }
});
// Get products near expiry (for discount campaigns)
router.get('/near-expiry', async (req, res) => {
    try {
        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);

        // Fetch products expiring today or in the next 3 days
        const products = await Product_1.default.find({
            expiryDate: { $gte: today, $lte: threeDaysLater }
        }).populate('categoryId', 'category_name');;

        res.json(products);
    } catch (error) {
        console.error('Error fetching near expiry products:', error);
        res.status(500).json({ message: error.message });
    }
});

exports.default = router;
