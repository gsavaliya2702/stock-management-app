import mongoose from 'mongoose';

interface ISupplier {
  supplier_name: string;
  contact_number: string;
  address: string;
  // Keep performance metrics from original design
  performanceScore?: number;
  deliverySpeedAvg?: number;
  qualityRatingAvg?: number;
  reliabilityScore?: number;
  totalDeliveries?: number;
}

const supplierSchema = new mongoose.Schema({
  supplier_name: { type: String, required: true },
  contact_number: { type: String, required: true },
  address: { type: String, required: true },
  // Keep performance metrics from original design
  performanceScore: { type: Number, default: 0 },
  deliverySpeedAvg: { type: Number, default: 0 },
  qualityRatingAvg: { type: Number, default: 0 },
  reliabilityScore: { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 }
}, {
  timestamps: true
});

const Supplier = mongoose.model('Supplier', supplierSchema);
export default Supplier;