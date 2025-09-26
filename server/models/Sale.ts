import mongoose from 'mongoose';

interface ISale {
  productId: string;
  quantity: number;
  totalPrice: number;
  date: Date;
  customerName: string; // Now required
  discountApplied?: number; // For discount feature
}

const saleSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  customerName: { type: String, required: true },
  discountApplied: { type: Number, default: 0 }
}, {
  timestamps: true
});

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;