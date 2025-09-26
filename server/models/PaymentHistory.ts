import mongoose from 'mongoose';

interface IPaymentHistory {
  transactionId: string;
  purchaseId?: string;
  amount: number;
  paymentMethod: string;
  status: 'success' | 'failed' | 'pending' | 'refunded';
  date: Date;
  message?: string;
  metadata?: Record<string, any>;
}

const paymentHistorySchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  purchaseId: { type: String, ref: 'Purchase' },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['success', 'failed', 'pending', 'refunded'], 
    default: 'pending' 
  },
  date: { type: Date, default: Date.now },
  message: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

const PaymentHistory = mongoose.model('PaymentHistory', paymentHistorySchema);
export default PaymentHistory;