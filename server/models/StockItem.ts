import mongoose from 'mongoose';

interface IStockItem {
  productId: string;
  quantity: number;
  lastUpdated: Date;
  minStockLevel: number;
  location?: string; // For warehouse tracking
}

const stockItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
  quantity: { type: Number, required: true, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  minStockLevel: { type: Number, required: true, default: 10 },
  location: { type: String }
}, {
  timestamps: true
});

const StockItem = mongoose.model('StockItem', stockItemSchema);
export default StockItem;