import mongoose from 'mongoose';

interface IStockOut {
  product_id: mongoose.Types.ObjectId;
  customer_id: mongoose.Types.ObjectId;
  quantity: number;
  date_dispatched: Date;
}

const stockOutSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  quantity: { type: Number, required: true },
  date_dispatched: { type: Date, default: Date.now, required: true }
}, {
  timestamps: true
});

const StockOut = mongoose.model('StockOut', stockOutSchema);
export default StockOut;
