import mongoose from 'mongoose';

interface IProduct {
  name: string;
  categoryId: mongoose.Types.ObjectId;
  unit: string; // kg, piece, box
  pricePerUnit: number;
  stockQuantity: number;
  expiryDate?: Date;
  supplierId?: mongoose.Types.ObjectId;
  image?: string; // Keep image field for UI
}

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  unit: { type: String, required: true },
  pricePerUnit: { type: Number, required: true },
  stockQuantity: { type: Number, required: true, default: 0 },
  expiryDate: { type: Date },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  image: { type: String }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product;