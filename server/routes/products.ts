import express from 'express';
import Product from '../models/Product';
import Category from '../models/Category';

const router = express.Router();

// Get all products with category details
router.get('/', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('categoryId', 'category_name')
      .populate('supplierId', 'supplier_name');
    
    console.log('Returning products with category details');
    res.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'category_name')
      .populate('supplierId', 'supplier_name');
      
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create product (validation removed)
router.post('/', async (req, res) => {
  try {
    console.log('Creating product with data:', req.body);
    
    // Convert expiryDays to expiryDate if provided
    if (req.body.expiryDays !== undefined && req.body.expiryDays !== null) {
      const days = Number(req.body.expiryDays);
      console.log('expiryDays provided:', days);
      
      if (!isNaN(days) && days >= 0) {
        req.body.expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        console.log('Set expiryDate to:', req.body.expiryDate);
      }
      // Remove expiryDays from the request body since it's not part of the model
      delete req.body.expiryDays;
    }
    
    // Convert price to pricePerUnit for new schema
    if (req.body.price !== undefined) {
      req.body.pricePerUnit = req.body.price;
      delete req.body.price;
    }
    
    // Set default stockQuantity if not provided
    if (req.body.stockQuantity === undefined) {
      req.body.stockQuantity = 0;
    }

    const product = new Product(req.body);
    const savedProduct = await product.save();
    
    // Populate category and supplier details
    const populatedProduct = await Product.findById(savedProduct._id)
      .populate('categoryId', 'category_name')
      .populate('supplierId', 'supplier_name');
    
    res.status(201).json(populatedProduct);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update product (validation removed)
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating product with data:', req.body);
    
    // Convert expiryDays to expiryDate if provided
    if (req.body.expiryDays !== undefined && req.body.expiryDays !== null) {
      const days = Number(req.body.expiryDays);
      console.log('expiryDays provided:', days);
      
      if (!isNaN(days) && days >= 0) {
        req.body.expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        console.log('Set expiryDate to:', req.body.expiryDate);
      }
      // Remove expiryDays from the request body since it's not part of the model
      delete req.body.expiryDays;
    }
    
    // Convert price to pricePerUnit for new schema
    if (req.body.price !== undefined) {
      req.body.pricePerUnit = req.body.price;
      delete req.body.price;
    }
    
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('categoryId', 'category_name')
      .populate('supplierId', 'supplier_name');
      
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // In a real system, we would also handle deleting related StockIn and StockOut records
    // or implement soft deletes to maintain data integrity
    
    res.json({ message: 'Product deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
