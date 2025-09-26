import mongoose from 'mongoose';

interface IPurchase {
  productId: string;
  quantity: number;
  totalPrice: number;
  date: Date;
  supplierName: string; // Now required
  supplierId: string; // Now required, for supplier performance tracking
  deliveryDate?: Date; // For supplier performance tracking
  qualityRating?: number; // For supplier performance tracking (1-5)
  paymentTransactionId?: string; // Added for payment tracking
  paymentStatus?: string; // Added for payment tracking
}

const purchaseSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  supplierName: { type: String, required: true },
  supplierId: { type: String, required: true },
  deliveryDate: { type: Date },
  qualityRating: { type: Number, min: 1, max: 5 },
  paymentTransactionId: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }
}, {
  timestamps: true
});

const Purchase = mongoose.model('Purchase', purchaseSchema);
export default Purchase;