import mongoose from 'mongoose';

interface IStockIn {
  product_id: mongoose.Types.ObjectId;
  supplier_id: mongoose.Types.ObjectId;
  quantity: number;
  date_received: Date;
  date_expected: Date;
}

const stockInSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  quantity: { type: Number, required: true },
  date_received: { type: Date, default: Date.now, required: true },
  date_expected: { type: Date, required: true }
}, {
  timestamps: true
});

const StockIn = mongoose.model('StockIn', stockInSchema);
export default StockIn;
