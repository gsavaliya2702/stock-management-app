"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockmanagement';
// Simple product schema
const productSchema = new mongoose_1.default.Schema({
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
// Simple stock item schema
const stockItemSchema = new mongoose_1.default.Schema({
    productId: { type: String, required: true, unique: true },
    quantity: { type: Number, required: true, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    minStockLevel: { type: Number, required: true, default: 10 },
    location: { type: String }
}, {
    timestamps: true
});
const Product = mongoose_1.default.model('Product', productSchema);
const StockItem = mongoose_1.default.model('StockItem', stockItemSchema);
const sampleProducts = [
    {
        name: 'Apples',
        category: 'Fruit',
        unit: 'kg',
        price: 3.50,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
    },
    {
        name: 'Bananas',
        category: 'Fruit',
        unit: 'kg',
        price: 2.20,
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    },
    {
        name: 'Carrots',
        category: 'Vegetable',
        unit: 'kg',
        price: 1.80
    },
    {
        name: 'Lettuce',
        category: 'Vegetable',
        unit: 'piece',
        price: 1.50,
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
    },
    {
        name: 'Oranges',
        category: 'Fruit',
        unit: 'kg',
        price: 3.00
    },
    {
        name: 'Tomatoes',
        category: 'Vegetable',
        unit: 'kg',
        price: 2.50,
        expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days from now
    }
];
async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        // Clear existing data
        await Product.deleteMany({});
        await StockItem.deleteMany({});
        console.log('Cleared existing data');
        // Insert sample products
        const products = await Product.insertMany(sampleProducts);
        console.log(`Inserted ${products.length} sample products`);
        // Create corresponding stock items
        const stockItems = products.map(product => ({
            productId: product._id,
            quantity: Math.floor(Math.random() * 50) + 10,
            minStockLevel: Math.floor(Math.random() * 10) + 5 // Random min level between 5-15
        }));
        await StockItem.insertMany(stockItems);
        console.log(`Inserted ${stockItems.length} stock items`);
        console.log('Database seeding completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}
seedDatabase();
