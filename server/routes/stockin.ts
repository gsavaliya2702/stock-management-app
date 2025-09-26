import express from 'express';
import StockIn from '../models/StockIn';
import Product from '../models/Product';

const router = express.Router();

// Get all stock-in records
router.get('/', async (req, res) => {
  try {
    const stockIns = await StockIn.find()
      .populate('product_id', 'name unit')
      .populate('supplier_id', 'supplier_name');
    res.json(stockIns);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get stock-in by ID
router.get('/:id', async (req, res) => {
  try {
    const stockIn = await StockIn.findById(req.params.id)
      .populate('product_id', 'name unit')
      .populate('supplier_id', 'supplier_name');
      
    if (!stockIn) {
      return res.status(404).json({ message: 'Stock-in record not found' });
    }
    res.json(stockIn);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create stock-in record and update product quantity
router.post('/', async (req, res) => {
  try {
    // Validate that date_expected is provided
    if (!req.body.date_expected) {
      return res.status(400).json({ message: 'date_expected is required' });
    }
    
    // Create the stock-in record
    const stockIn = new StockIn({
      product_id: req.body.product_id,
      supplier_id: req.body.supplier_id,
      quantity: req.body.quantity,
      date_received: req.body.date_received || new Date(),
      date_expected: new Date(req.body.date_expected)
    });
    
    // Update the product's stock quantity
    const product = await Product.findById(req.body.product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    product.stockQuantity += Number(req.body.quantity);
    
    // Save both documents
    await product.save();
    const newStockIn = await stockIn.save();
    
    // Return populated stock-in record
    const populatedStockIn = await StockIn.findById(newStockIn._id)
      .populate('product_id', 'name unit')
      .populate('supplier_id', 'supplier_name');
      
    res.status(201).json(populatedStockIn);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update stock-in record (limited, as this could affect inventory accuracy)
router.put('/:id', async (req, res) => {
  try {
    // Find original record to calculate quantity difference
    const originalStockIn = await StockIn.findById(req.params.id);
    if (!originalStockIn) {
      return res.status(404).json({ message: 'Stock-in record not found' });
    }
    
    // Calculate quantity difference if quantity is being updated
    let quantityDiff = 0;
    if (req.body.quantity !== undefined) {
      quantityDiff = Number(req.body.quantity) - Number(originalStockIn.quantity);
      originalStockIn.quantity = req.body.quantity;
    }
    
    // Update other fields
    if (req.body.date_received) originalStockIn.date_received = req.body.date_received;
    if (req.body.date_expected) originalStockIn.date_expected = new Date(req.body.date_expected);
    
    // If quantity changed, update product stock
    if (quantityDiff !== 0) {
      const product = await Product.findById(originalStockIn.product_id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      product.stockQuantity += quantityDiff;
      await product.save();
    }
    
    const updatedStockIn = await originalStockIn.save();
    
    // Return populated stock-in record
    const populatedStockIn = await StockIn.findById(updatedStockIn._id)
      .populate('product_id', 'name unit')
      .populate('supplier_id', 'supplier_name');
      
    res.json(populatedStockIn);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete stock-in record (with inventory adjustment)
router.delete('/:id', async (req, res) => {
  try {
    const stockIn = await StockIn.findById(req.params.id);
    if (!stockIn) {
      return res.status(404).json({ message: 'Stock-in record not found' });
    }
    
    // Update product quantity
    const product = await Product.findById(stockIn.product_id);
    if (product) {
      product.stockQuantity -= Number(stockIn.quantity);
      // Prevent negative stock
      if (product.stockQuantity < 0) product.stockQuantity = 0;
      await product.save();
    }
    
    await stockIn.deleteOne();
    res.json({ message: 'Stock-in record deleted and inventory updated' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
