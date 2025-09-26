import express from 'express';
import Purchase from '../models/Purchase';
import Product from '../models/Product';
import StockIn from '../models/StockIn';
import StockItem from '../models/StockItem';
import Supplier from '../models/Supplier';
import PaymentHistory from '../models/PaymentHistory';

const router = express.Router();

// Get all purchases
router.get('/', async (req, res) => {
  try {
    const purchases = await Purchase.find();
    res.json(purchases);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create purchase (validation removed)
router.post('/', async (req, res) => {
  try {
    const { productId, quantity, supplierName, supplierId, deliveryDate, qualityRating, paymentTransactionId, paymentStatus } = req.body;
    
    // Validate required fields
    if (!supplierName || !supplierId) {
      return res.status(400).json({ message: 'Supplier name and ID are required' });
    }
    
    // Get product price to calculate total price
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Calculate total price if not provided
    const totalPrice = req.body.totalPrice || ((product.pricePerUnit || 0) * quantity);
    
    // Create purchase record
    const purchase = new Purchase({
      productId,
      quantity,
      totalPrice,
      supplierName,
      supplierId,
      deliveryDate,
      qualityRating,
      paymentTransactionId,
      paymentStatus
    });
    
    const savedPurchase = await purchase.save();
    
    // Create payment history record if payment was made
    if (paymentTransactionId && paymentStatus && paymentStatus !== 'pending') {
      try {
        const paymentHistory = new PaymentHistory({
          transactionId: paymentTransactionId,
          purchaseId: savedPurchase._id,
          amount: totalPrice,
          paymentMethod: 'cash', // Default to cash payment
          status: paymentStatus === 'paid' ? 'success' : 'failed',
          message: `Purchase payment - ${paymentStatus}`,
          metadata: {
            purchaseId: savedPurchase._id,
            productId: savedPurchase.productId,
            supplierName: savedPurchase.supplierName
          }
        });
        
        await paymentHistory.save();
        console.log('Payment history record created:', paymentHistory._id);
      } catch (error) {
        console.error('Error creating payment history record:', error);
        // Don't fail the purchase if payment history creation fails
      }
    }
    
    // Update stock
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
    
    // Update supplier performance if supplierId is provided
    if (supplierId && deliveryDate && qualityRating) {
      await updateSupplierPerformance(supplierId, deliveryDate, qualityRating);
    }
    
    res.status(201).json(savedPurchase);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Helper function to update supplier performance
async function updateSupplierPerformance(supplierId: string, deliveryDate: Date, qualityRating: number) {
  try {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return;
    
    // Calculate delivery speed (in days) - actual calculation based on order date to delivery date
    // For now, we'll use a default of 3 days as a placeholder for good performance
    // Lower numbers are better for delivery speed (faster delivery)
    const currentDate = new Date();
    const promisedDeliveryDate = new Date(deliveryDate);
    
    // If the delivery date is in the past, use a default value
    // In a real app, you would track both order date and actual delivery date
    const deliverySpeed = promisedDeliveryDate > currentDate 
      ? Math.ceil((promisedDeliveryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) 
      : 3; // Default good performance value
    
    // Update supplier metrics
    const totalDeliveries = supplier.totalDeliveries + 1;
    
    // For delivery speed, we want lower numbers to be better
    // We'll use a 10-point scale where 10 is best (same day) and 0 is worst (10+ days)
    const normalizedDeliverySpeed = Math.max(0, 10 - deliverySpeed);
    
    // Calculate weighted averages
    const deliverySpeedAvg = totalDeliveries > 0 ? (supplier.deliverySpeedAvg * supplier.totalDeliveries + deliverySpeed) / totalDeliveries : supplier.deliverySpeedAvg || 0;
    const qualityRatingAvg = totalDeliveries > 0 ? (supplier.qualityRatingAvg * supplier.totalDeliveries + qualityRating) / totalDeliveries : supplier.qualityRatingAvg || 0;
    
    // Calculate reliability score (simplified - percentage of on-time deliveries)
    // For this example, we'll consider anything delivered in less than 7 days as "on-time"
    const isOnTime = deliverySpeed <= 7;
    const reliabilityScore = ((supplier.reliabilityScore / 100) * supplier.totalDeliveries + (isOnTime ? 1 : 0)) / totalDeliveries * 100;
    
    // Calculate overall performance score (weighted average)
    // Convert delivery speed to a 0-100 scale where 100 is best (same day delivery)
    const deliverySpeedScore = Math.max(0, 100 - (deliverySpeedAvg * 10)); 
    
    // Convert quality rating to 0-100 scale
    const qualityScore = qualityRatingAvg > 0 ? (qualityRatingAvg / 5) * 100 : 0;
    
    // Calculate final score with weights
    const performanceScore = (deliverySpeedScore * 0.3) + (qualityScore * 0.5) + (reliabilityScore * 0.2);
    
    // Update supplier
    await Supplier.findByIdAndUpdate(supplierId, {
      deliverySpeedAvg,
      qualityRatingAvg,
      reliabilityScore,
      performanceScore,
      totalDeliveries
    });
  } catch (error) {
    console.error('Error updating supplier performance:', error);
  }
}

// Update purchase (validation removed)
router.put('/:id', async (req, res) => {
  try {
    const { productId, quantity, supplierName, supplierId, deliveryDate, qualityRating, paymentTransactionId, paymentStatus } = req.body;
    
    // Find the existing purchase
    const existingPurchase = await Purchase.findById(req.params.id);
    if (!existingPurchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    
    // Ensure supplier information remains required
    if (supplierName === '' || supplierId === '') {
      return res.status(400).json({ message: 'Supplier name and ID are required' });
    }
    
    // If productId or quantity changed, recalculate totalPrice
    if (productId || quantity) {
      const product = await Product.findById(productId || existingPurchase.productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Calculate new total price
      const newQuantity = quantity || existingPurchase.quantity;
      req.body.totalPrice = (product.pricePerUnit || 0) * newQuantity;
    }
    
    // Prepare the update object
    const updateData: any = {};
    if (productId) updateData.productId = productId;
    if (quantity) updateData.quantity = quantity;
    if (supplierName) updateData.supplierName = supplierName;
    if (supplierId) updateData.supplierId = supplierId;
    if (deliveryDate) updateData.deliveryDate = new Date(deliveryDate);
    if (qualityRating !== undefined) updateData.qualityRating = qualityRating;
    if (req.body.totalPrice !== undefined) updateData.totalPrice = req.body.totalPrice;
    if (paymentTransactionId !== undefined) updateData.paymentTransactionId = paymentTransactionId;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    
    // Update the purchase
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!updatedPurchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    
    // Create payment history record if payment was made/updated
    if (paymentTransactionId && paymentStatus && paymentStatus !== 'pending') {
      try {
        // Check if payment history already exists for this transaction
        const existingPaymentHistory = await PaymentHistory.findOne({
          transactionId: paymentTransactionId
        });
        
        if (!existingPaymentHistory) {
          // Create new payment history record
          const paymentHistory = new PaymentHistory({
            transactionId: paymentTransactionId,
            purchaseId: updatedPurchase._id,
            amount: updatedPurchase.totalPrice,
            paymentMethod: 'cash', // Default to cash payment
            status: paymentStatus === 'paid' ? 'success' : 'failed',
            message: `Updated purchase payment - ${paymentStatus}`,
            metadata: {
              purchaseId: updatedPurchase._id,
              productId: updatedPurchase.productId,
              supplierName: updatedPurchase.supplierName,
              action: 'updated'
            }
          });
          
          await paymentHistory.save();
          console.log('Payment history record created for update:', paymentHistory._id);
        } else {
          // Update existing payment history record
          existingPaymentHistory.status = paymentStatus === 'paid' ? 'success' : 'failed';
          existingPaymentHistory.message = `Updated purchase payment - ${paymentStatus}`;
          existingPaymentHistory.metadata = {
            ...existingPaymentHistory.metadata,
            action: 'updated',
            updatedPurchaseId: updatedPurchase._id
          };
          
          await existingPaymentHistory.save();
          console.log('Payment history record updated for transaction:', paymentTransactionId);
        }
      } catch (error) {
        console.error('Error creating/updating payment history record:', error);
        // Don't fail the purchase update if payment history creation fails
      }
    }
    
    // Update supplier performance if applicable
    if (supplierId && deliveryDate && qualityRating !== undefined) {
      await updateSupplierPerformance(
        supplierId,
        new Date(deliveryDate),
        qualityRating
      );
    }
    
    res.json(updatedPurchase);
  } catch (error: any) {
    console.error('Error updating purchase:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a purchase
router.delete('/:id', async (req, res) => {
  try {
    // Validate the ID parameter
    const { id } = req.params;
    
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({
        message: 'Invalid purchase ID: ID is required and must be a non-empty string'
      });
    }
    
    // Clean the ID
    const cleanId = id.trim();
    
    // Find the purchase first to get product and quantity details
    const purchase = await Purchase.findById(cleanId);
    
    if (!purchase) {
      return res.status(404).json({
        message: `Purchase not found with ID: ${cleanId}`
      });
    }
    
    // If this is the last purchase from this supplier, inform the user
    const supplierPurchases = await Purchase.find({ supplierId: purchase.supplierId });
    if (supplierPurchases.length === 1) {
      console.log('Warning: Last purchase from supplier:', purchase.supplierName);
      // We'll still allow the deletion but log a warning
    }
    
    // When deleting a purchase, decrease the stock quantity
    const stockItem = await StockItem.findOne({ productId: purchase.productId });
    
    if (stockItem) {
      // Decrease stock quantity but ensure it doesn't go below 0
      stockItem.quantity = Math.max(0, stockItem.quantity - purchase.quantity);
      stockItem.lastUpdated = new Date();
      await stockItem.save();
    }
    
    // Delete the purchase record
    await Purchase.findByIdAndDelete(cleanId);
    
    res.json({ message: 'Purchase deleted and stock updated' });
  } catch (error: any) {
    console.error('Error deleting purchase:', error);
    
    // Handle specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid purchase ID format: ID must be a valid MongoDB ObjectId'
      });
    }
    
    res.status(500).json({ message: error.message || 'Failed to delete purchase' });
  }
});

export default router;
