// CommonJS style imports for compatibility
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Database connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockmanagement';

// Define models directly
// Product model
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  expiryDate: { type: Date },
  supplierId: { type: String }
}, {
  timestamps: true
});

// StockItem model
const stockItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
  quantity: { type: Number, required: true, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  minStockLevel: { type: Number, required: true, default: 10 },
  location: { type: String }
}, {
  timestamps: true
});

// Sale model
const saleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  customerName: { type: String },
  discountApplied: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Purchase model
const purchaseSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  supplierName: { type: String },
  supplierId: { type: String },
  deliveryDate: { type: Date },
  qualityRating: { type: Number }
}, {
  timestamps: true
});

// Supplier model
const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactInfo: { type: String, required: true },
  performanceScore: { type: Number, default: 0 },
  deliverySpeedAvg: { type: Number, default: 0 },
  qualityRatingAvg: { type: Number, default: 0 },
  reliabilityScore: { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 }
}, {
  timestamps: true
});

async function clearDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
    
    console.log('Connected to MongoDB. Starting database cleanup...');
    
    // Register models
    const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
    const StockItem = mongoose.models.StockItem || mongoose.model('StockItem', stockItemSchema);
    const Sale = mongoose.models.Sale || mongoose.model('Sale', saleSchema);
    const Purchase = mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema);
    const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);
    
    // Drop all collections
    console.log('Clearing Products collection...');
    await Product.deleteMany({});
    
    console.log('Clearing StockItems collection...');
    await StockItem.deleteMany({});
    
    console.log('Clearing Sales collection...');
    await Sale.deleteMany({});
    
    console.log('Clearing Purchases collection...');
    await Purchase.deleteMany({});
    
    console.log('Clearing Suppliers collection...');
    await Supplier.deleteMany({});
    
    console.log('All collections have been cleared.');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    
    console.log('Database reset completed successfully.');
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

// Run the function
clearDatabase();
