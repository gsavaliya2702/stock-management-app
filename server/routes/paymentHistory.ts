import express from 'express';
import PaymentHistory from '../models/PaymentHistory';

const router = express.Router();

// Get all payment history records
router.get('/', async (req, res) => {
  try {
    const paymentHistory = await PaymentHistory.find()
      .populate('purchaseId', 'productId supplierName totalPrice')
      .sort({ date: -1 });
    
    // Transform the data to match the frontend interface
    const transformedHistory = paymentHistory.map(record => {
      const purchaseDetails = record.purchaseId && typeof record.purchaseId === 'object' ? {
        productId: (record.purchaseId as any).productId,
        supplierName: (record.purchaseId as any).supplierName,
        totalPrice: (record.purchaseId as any).totalPrice
      } : null;
      
      return {
        id: record._id,
        transactionId: record.transactionId,
        purchaseId: record.purchaseId,
        date: record.date,
        amount: record.amount,
        paymentMethod: record.paymentMethod,
        status: record.status,
        message: record.message,
        metadata: record.metadata,
        purchaseDetails
      };
    });
    
    res.json(transformedHistory);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific payment history record
router.get('/:id', async (req, res) => {
  try {
    const paymentRecord = await PaymentHistory.findById(req.params.id)
      .populate('purchaseId');
    
    if (!paymentRecord) {
      return res.status(404).json({ message: 'Payment record not found' });
    }
    
    res.json(paymentRecord);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new payment history record
router.post('/', async (req, res) => {
  try {
    const { transactionId, purchaseId, amount, paymentMethod, status, message, metadata } = req.body;
    
    // Validate required fields
    if (!transactionId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        message: 'Transaction ID, amount, and payment method are required' 
      });
    }
    
    // Check if transaction ID already exists
    const existingRecord = await PaymentHistory.findOne({ transactionId });
    if (existingRecord) {
      return res.status(409).json({ 
        message: 'Payment record with this transaction ID already exists' 
      });
    }
    
    const paymentHistory = new PaymentHistory({
      transactionId,
      purchaseId,
      amount,
      paymentMethod,
      status: status || 'pending',
      message,
      metadata
    });
    
    const savedRecord = await paymentHistory.save();
    
    // Populate purchase details for the response
    await savedRecord.populate('purchaseId');
    
    res.status(201).json(savedRecord);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update a payment history record
router.put('/:id', async (req, res) => {
  try {
    const { transactionId, purchaseId, amount, paymentMethod, status, message, metadata } = req.body;
    
    const updatedRecord = await PaymentHistory.findByIdAndUpdate(
      req.params.id,
      {
        transactionId,
        purchaseId,
        amount,
        paymentMethod,
        status,
        message,
        metadata
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedRecord) {
      return res.status(404).json({ message: 'Payment record not found' });
    }
    
    await updatedRecord.populate('purchaseId');
    res.json(updatedRecord);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a payment history record
router.delete('/:id', async (req, res) => {
  try {
    const deletedRecord = await PaymentHistory.findByIdAndDelete(req.params.id);
    
    if (!deletedRecord) {
      return res.status(404).json({ message: 'Payment record not found' });
    }
    
    res.json({ message: 'Payment record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;