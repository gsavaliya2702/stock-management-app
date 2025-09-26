import express from 'express';
import Sale from '../models/Sale';
import StockOut from '../models/StockOut';
import Product from '../models/Product';
import Customer from '../models/Customer';
import StockItem from '../models/StockItem';

const router = express.Router();

// Get all sales (only new stock-out records)
router.get('/', async (req, res) => {
  try {
    // Get new stock-out records with populated product and customer data
    const stockOuts = await StockOut.find()
      .populate('product_id', 'name unit pricePerUnit')
      .populate('customer_id', 'customer_name');
    
    // Map stock-out records to match sales format for frontend compatibility
    const mappedStockOuts = stockOuts.map(stockOut => {
      // Get product details
      const product = stockOut.product_id as any;
      const customer = stockOut.customer_id as any;
      
      // Calculate price based on product price
      const totalPrice = (product.pricePerUnit || 0) * stockOut.quantity;
      
      return {
        _id: stockOut._id,
        productId: stockOut.product_id,
        productName: product.name,
        quantity: stockOut.quantity,
        totalPrice: totalPrice,
        customerName: customer.customer_name,
        discountApplied: 0, // Not tracking discounts in new schema yet
        date: stockOut.date_dispatched
      };
    });
    
    // Return only the new stock-out records
    res.json(mappedStockOuts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create sale - now creates a StockOut record (validation removed)
router.post('/', async (req, res) => {
  try {
    const { productId, quantity, customerName, customerId, contactNumber, address } = req.body;
    
    // Debug log
    console.log('Sale request received:', {
      productId,
      quantity,
      customerName,
      customerId,
      contactNumber,
      address,
      requestBody: req.body
    });
    
    // Validate required fields
    if (!customerName && !customerId) {
      return res.status(400).json({ message: 'Customer information is required' });
    }
    
    // Debug log for product ID
    console.log('Looking up product with ID:', productId, 'type:', typeof productId);
    
    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found with ID:', productId);
      console.log('Available product IDs in database:', await Product.distinct('_id'));
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log('Product found:', {
      _id: product._id,
      name: product.name,
      stockQuantity: product.stockQuantity,
      unit: product.unit
    });
    
    // Check stock availability in both Product and StockItem collections
    let availableStock = product.stockQuantity || 0;
    
    // Check StockItem collection for additional stock
    const stockItem = await StockItem.findOne({ productId });
    if (stockItem) {
      availableStock += stockItem.quantity;
      console.log('Found StockItem:', {
        productId: stockItem.productId,
        quantity: stockItem.quantity,
        lastUpdated: stockItem.lastUpdated
      });
    }
    
    console.log('Detailed stock availability check:', {
      productId,
      productStock: product.stockQuantity,
      stockItemStock: stockItem ? stockItem.quantity : 'Not found',
      totalAvailable: availableStock,
      requested: quantity,
      productDetails: {
        name: product.name,
        unit: product.unit,
        pricePerUnit: product.pricePerUnit
      }
    });
    
    // Additional debug to see if there are other StockItem records
    const allStockItems = await StockItem.find({ productId });
    console.log('All StockItem records for this product:', allStockItems);
    
    if (availableStock < quantity) {
      console.log('Insufficient stock error:', {
        available: availableStock,
        requested: quantity
      });
      return res.status(400).json({
        message: 'Insufficient stock',
        available: availableStock,
        requested: quantity
      });
    }
    
    // Calculate total price and apply discount if applicable
    let totalPrice = (product.pricePerUnit || 0) * quantity;
    let discountApplied = 0;
    
    // Check if product is near expiry (within 3 days)
    if (product.expiryDate) {
      const daysUntilExpiry = product.expiryDate ? Math.ceil(
        (product.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ) : 0;
      
      // Apply tiered discounts based on days until expiry
      if (daysUntilExpiry <= 1 && daysUntilExpiry > 0) {
        // 1 day or less: 30% discount
        discountApplied = totalPrice * 0.3;
        totalPrice -= discountApplied;
      } else if (daysUntilExpiry <= 2 && daysUntilExpiry > 0) {
        // 2 days: 20% discount
        discountApplied = totalPrice * 0.2;
        totalPrice -= discountApplied;
      } else if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
        // 3 days: 10% discount
        discountApplied = totalPrice * 0.1;
        totalPrice -= discountApplied;
      }
    }
    
    let customer_id;
    
    // Find or create customer
    if (customerId) {
      // Use provided customer ID
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      customer_id = customer._id;
    } else {
      // Look up customer by name or create a new one
      let customer = await Customer.findOne({ customer_name: customerName });
      
      if (!customer) {
        // Create new customer with minimal information
        customer = new Customer({
          customer_name: customerName,
          contact_number: contactNumber || '',
          address: address || ''
        });
        
        await customer.save();
      }
      
      customer_id = customer._id;
    }
    
    // Create StockOut record (this is the new system)
    const stockOut = new StockOut({
      product_id: productId,
      customer_id: customer_id,
      quantity: quantity,
      date_dispatched: new Date()
    });
    
    const savedStockOut = await stockOut.save();
    
    // Update StockItem stock quantity instead of Product model
    console.log('Updating StockItem stock:', {
      productId: product._id,
      currentStock: stockItem ? stockItem.quantity : 0,
      quantityToDeduct: quantity,
      newStock: (stockItem ? stockItem.quantity : 0) - quantity
    });
    
    if (stockItem) {
      stockItem.quantity -= quantity;
      await stockItem.save();
    } else {
      // If no StockItem exists, create one
      const newStockItem = new StockItem({
        productId: product._id,
        quantity: -quantity, // Negative quantity for sales
        minStockLevel: 10,
        lastUpdated: new Date()
      });
      await newStockItem.save();
    }
    
    // Note: We're not updating Product model for sales to avoid double-deduction
    // Product model is for general product information, not current stock levels
    
    // Return response with StockOut record
    res.status(201).json({
      stockOut: savedStockOut,
      totalPrice: totalPrice,
      discountApplied: discountApplied
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a sale
router.delete('/:id', async (req, res) => {
  try {
    // Validate the ID parameter
    const { id } = req.params;
    
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({
        message: 'Invalid sale ID: ID is required and must be a non-empty string'
      });
    }
    
    // Clean the ID
    const cleanId = id.trim();
    
    // Try to find the record in both collections
    const sale = await Sale.findById(cleanId);
    const stockOut = await StockOut.findById(cleanId);
    
    if (!sale && !stockOut) {
      return res.status(404).json({
        message: `Sale record not found with ID: ${cleanId}`
      });
    }
    
    // Handle legacy sale record
    if (sale) {
      // When deleting a legacy sale, restore the stock quantity in the product
      const product = await Product.findById(sale.productId);
      
      if (product) {
        // Restore stock quantity
        product.stockQuantity += sale.quantity;
        await product.save();
      }
      
      // Delete the sale
      await Sale.findByIdAndDelete(cleanId);
    }
    
    // Handle new StockOut record
    if (stockOut) {
      // Restore StockItem quantity
      const stockItem = await StockItem.findOne({ productId: stockOut.product_id });
      
      if (stockItem) {
        stockItem.quantity += stockOut.quantity;
        await stockItem.save();
      } else {
        // If no StockItem exists, create one with the restored quantity
        const newStockItem = new StockItem({
          productId: stockOut.product_id,
          quantity: stockOut.quantity,
          minStockLevel: 10,
          lastUpdated: new Date()
        });
        await newStockItem.save();
      }
      
      // Delete the stock-out record
      await StockOut.findByIdAndDelete(cleanId);
    }
    
    res.json({ message: 'Sale deleted and stock restored' });
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    
    // Handle specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid record ID format: ID must be a valid MongoDB ObjectId'
      });
    }
    
    res.status(500).json({ message: error.message || 'Failed to delete sale' });
  }
});

export default router;
