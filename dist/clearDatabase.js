// CommonJS style imports for compatibility
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Supplier = require('./models/Supplier');
const Customer = require('./models/Customer');
const StockIn = require('./models/StockIn');
const StockOut = require('./models/StockOut');
// Keep old models for backward compatibility during migration
const StockItem = require('./models/StockItem');
const Sale = require('./models/Sale');
const Purchase = require('./models/Purchase');
// Load environment variables
dotenv.config();
// Database connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockmanagement';
async function clearDatabase() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
        console.log('Connected to MongoDB. Starting database cleanup...');
        // Drop all collections - new schema
        console.log('Clearing Products collection...');
        await Product.deleteMany({});
        console.log('Clearing Categories collection...');
        await Category.deleteMany({});
        console.log('Clearing Suppliers collection...');
        await Supplier.deleteMany({});
        console.log('Clearing Customers collection...');
        await Customer.deleteMany({});
        console.log('Clearing StockIn collection...');
        await StockIn.deleteMany({});
        console.log('Clearing StockOut collection...');
        await StockOut.deleteMany({});
        // Clear legacy collections if they exist
        console.log('Clearing legacy collections...');
        try {
            await StockItem.deleteMany({});
            await Sale.deleteMany({});
            await Purchase.deleteMany({});
        }
        catch (err) {
            console.log('Some legacy collections may not exist yet - continuing...');
        }
        console.log('All collections have been cleared.');
        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed.');
        console.log('Database reset completed successfully.');
    }
    catch (error) {
        console.error('Error clearing database:', error);
        process.exit(1);
    }
}
// Run the function
clearDatabase();
