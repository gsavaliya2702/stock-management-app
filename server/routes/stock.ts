import express from 'express';
import StockItem from '../models/StockItem';
import Product from '../models/Product';
import { validate, stockValidationSchemas } from '../middleware/validation';

const router = express.Router();

// Get all stock items with product info
router.get('/', async (req, res) => {
  try {
    const stockItems = await StockItem.find();
    const stockWithProducts = await Promise.all(stockItems.map(async (item) => {
      const product = await Product.findById(item.productId);
      return {
        ...item.toObject(),
        product
      };
    }));
    res.json(stockWithProducts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get stock item by product ID
router.get('/product/:productId', async (req, res) => {
  try {
    const stockItem = await StockItem.findOne({ productId: req.params.productId });
    if (!stockItem) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    res.json(stockItem);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update stock quantity with validation
router.put('/product/:productId', validate(stockValidationSchemas.update), async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.productId;
    
    // Update StockItem
    const stockItem = await StockItem.findOneAndUpdate(
      { productId },
      {
        quantity,
        lastUpdated: new Date()
      },
      { new: true, upsert: true }
    );
    
    // Also update Product.stockQuantity
    await Product.findByIdAndUpdate(productId, {
      stockQuantity: quantity,
      updatedAt: new Date()
    });
    
    res.json(stockItem);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Add stock (increment) with validation
router.post('/add/:productId', validate(stockValidationSchemas.add), async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.productId;
    
    // Get the current product stock quantity
    const product = await Product.findById(productId);
    let currentProductStock = product ? product.stockQuantity || 0 : 0;
    
    const stockItem = await StockItem.findOne({ productId });
    
    if (stockItem) {
      stockItem.quantity += quantity;
      stockItem.lastUpdated = new Date();
      await stockItem.save();
    } else {
      const newStockItem = new StockItem({
        productId,
        quantity,
        lastUpdated: new Date()
      });
      await newStockItem.save();
    }
    
    // Update Product stock quantity
    currentProductStock += quantity;
    await Product.findByIdAndUpdate(productId, {
      stockQuantity: currentProductStock,
      updatedAt: new Date()
    });
    
    res.json({
      message: 'Stock added successfully',
      stockItem: stockItem || { productId, quantity, lastUpdated: new Date() },
      productStock: currentProductStock
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Remove stock (decrement) with validation
router.post('/remove/:productId', validate(stockValidationSchemas.remove), async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.productId;
    
    // Get the current product stock quantity
    const product = await Product.findById(productId);
    let currentProductStock = product ? product.stockQuantity || 0 : 0;
    
    const stockItem = await StockItem.findOne({ productId });
    
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
    await Product.findByIdAndUpdate(productId, {
      stockQuantity: currentProductStock,
      updatedAt: new Date()
    });
    
    res.json({
      message: 'Stock removed successfully',
      stockItem,
      productStock: currentProductStock
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
