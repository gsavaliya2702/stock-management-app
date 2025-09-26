import express from 'express';
import Customer from '../models/Customer';

const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const customer = new Customer({
      customer_name: req.body.customer_name,
      contact_number: req.body.contact_number,
      address: req.body.address
    });
    
    const newCustomer = await customer.save();
    res.status(201).json(newCustomer);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    if (req.body.customer_name) customer.customer_name = req.body.customer_name;
    if (req.body.contact_number) customer.contact_number = req.body.contact_number;
    if (req.body.address) customer.address = req.body.address;
    
    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Check if customer is referenced in any StockOut records
    const StockOut = require('../models/StockOut').default;
    const stockOuts = await StockOut.find({ customer_id: req.params.id });
    
    if (stockOuts.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete customer that has stock-out records', 
        stockOutCount: stockOuts.length 
      });
    }
    
    await customer.deleteOne();
    res.json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
