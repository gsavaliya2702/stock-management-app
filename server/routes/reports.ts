import express from 'express';
import mongoose from 'mongoose';
import StockItem from '../models/StockItem';
import Product from '../models/Product';
import Sale from '../models/Sale';
import Purchase from '../models/Purchase';
import Supplier from '../models/Supplier';
import StockOut from '../models/StockOut';

const router = express.Router();

// Get low stock alerts
router.get('/low-stock', async (req, res) => {
  try {
    const lowStockItems = await StockItem.find({ $expr: { $lte: ['$quantity', '$minStockLevel'] } });
    const alerts = (await Promise.all(lowStockItems.map(async (item) => {
      console.log('Fetching product with ID:', item.productId); // Log the product ID being fetched
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        console.warn('Invalid productId:', item.productId);
        return null;
      }
      const product = await Product.findById(item.productId);
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
  } catch (error: any) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get stock value
router.get('/stock-value', async (req, res) => {
  try {
    const stockItems = await StockItem.find();
    let totalValue = 0;
    
    for (const item of stockItems) {
      console.log('Fetching product with ID:', item.productId); // Log the product ID being fetched
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        console.warn('Invalid productId in stock value calculation:', item.productId);
        continue;
      }
      const product = await Product.findById(item.productId);
      if (product) {
        // Type assertion to access pricePerUnit property
        const productData = product as any;
        totalValue += item.quantity * (productData.pricePerUnit || 0);
      } else {
        console.warn('Product not found for ID:', item.productId);
      }
    }
    
    res.json({ totalValue });
  } catch (error: any) {
    console.error('Error fetching stock value:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get total sales
router.get('/total-sales', async (req, res) => {
  try {
    // Get sales from the legacy Sale model
    const legacySales = await Sale.find();
    const legacyTotalSales = legacySales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    
    // Get sales from the new StockOut model
    const stockOuts = await StockOut.find()
      .populate('product_id', 'pricePerUnit');
    
    const stockOutTotalSales = stockOuts.reduce((sum, stockOut) => {
      const product = stockOut.product_id as any;
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
  } catch (error: any) {
    console.error('Error fetching total sales:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get supplier performance scores
router.get('/supplier-performance', async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (error: any) {
    console.error('Error fetching supplier performance:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get products near expiry (for discount campaigns)
// Note: expiryDate feature removed for simplicity
router.get('/near-expiry', async (req, res) => {
  try {
    // In a real implementation, this would find products that expire within 3 days
    // For now, return empty array since expiryDate is not implemented
    res.json([]);
  } catch (error: any) {
    console.error('Error fetching near expiry products:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
