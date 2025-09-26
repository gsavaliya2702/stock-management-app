import express from 'express';
import StockOut from '../models/StockOut';
import Product from '../models/Product';

const router = express.Router();

// Get all stock-out records
router.get('/', async (req, res) => {
  try {
    const stockOuts = await StockOut.find()
      .populate('product_id', 'name unit')
      .populate('customer_id', 'customer_name');
    res.json(stockOuts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get stock-out by ID
router.get('/:id', async (req, res) => {
  try {
    const stockOut = await StockOut.findById(req.params.id)
      .populate('product_id', 'name unit')
      .populate('customer_id', 'customer_name');
      
    if (!stockOut) {
      return res.status(404).json({ message: 'Stock-out record not found' });
    }
    res.json(stockOut);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create stock-out record and update product quantity
router.post('/', async (req, res) => {
  try {
    // Check if there's enough stock
    const product = await Product.findById(req.body.product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const requestedQuantity = Number(req.body.quantity);
    if (product.stockQuantity < requestedQuantity) {
      return res.status(400).json({ 
        message: 'Insufficient stock', 
        available: product.stockQuantity,
        requested: requestedQuantity 
      });
    }
    
    // Create the stock-out record
    const stockOut = new StockOut({
      product_id: req.body.product_id,
      customer_id: req.body.customer_id,
      quantity: requestedQuantity,
      date_dispatched: req.body.date_dispatched || new Date()
    });
    
    // Update the product's stock quantity
    product.stockQuantity -= requestedQuantity;
    
    // Save both documents
    await product.save();
    const newStockOut = await stockOut.save();
    
    // Return populated stock-out record
    const populatedStockOut = await StockOut.findById(newStockOut._id)
      .populate('product_id', 'name unit')
      .populate('customer_id', 'customer_name');
      
    res.status(201).json(populatedStockOut);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update stock-out record (limited, as this could affect inventory accuracy)
router.put('/:id', async (req, res) => {
  try {
    // Find original record to calculate quantity difference
    const originalStockOut = await StockOut.findById(req.params.id);
    if (!originalStockOut) {
      return res.status(404).json({ message: 'Stock-out record not found' });
    }
    
    // Calculate quantity difference if quantity is being updated
    let quantityDiff = 0;
    if (req.body.quantity !== undefined) {
      quantityDiff = Number(originalStockOut.quantity) - Number(req.body.quantity);
      originalStockOut.quantity = req.body.quantity;
    }
    
    // Update other fields
    if (req.body.date_dispatched) originalStockOut.date_dispatched = req.body.date_dispatched;
    
    // If quantity changed, update product stock
    if (quantityDiff !== 0) {
      const product = await Product.findById(originalStockOut.product_id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Add the difference back to stock (could be positive or negative)
      product.stockQuantity += quantityDiff;
      
      // Prevent negative stock
      if (product.stockQuantity < 0) {
        return res.status(400).json({ 
          message: 'Cannot update - would result in negative stock',
          available: product.stockQuantity + Math.abs(quantityDiff),
          requested: req.body.quantity
        });
      }
      
      await product.save();
    }
    
    const updatedStockOut = await originalStockOut.save();
    
    // Return populated stock-out record
    const populatedStockOut = await StockOut.findById(updatedStockOut._id)
      .populate('product_id', 'name unit')
      .populate('customer_id', 'customer_name');
      
    res.json(populatedStockOut);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete stock-out record (with inventory adjustment)
router.delete('/:id', async (req, res) => {
  try {
    const stockOut = await StockOut.findById(req.params.id);
    if (!stockOut) {
      return res.status(404).json({ message: 'Stock-out record not found' });
    }
    
    // Update product quantity - add back to stock
    const product = await Product.findById(stockOut.product_id);
    if (product) {
      product.stockQuantity += Number(stockOut.quantity);
      await product.save();
    }
    
    await stockOut.deleteOne();
    res.json({ message: 'Stock-out record deleted and inventory updated' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
