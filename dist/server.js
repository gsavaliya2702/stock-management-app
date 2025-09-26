"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const products_1 = __importDefault(require("./routes/products"));
const stock_1 = __importDefault(require("./routes/stock"));
const sales_1 = __importDefault(require("./routes/sales"));
const purchases_1 = __importDefault(require("./routes/purchases"));
const reports_1 = __importDefault(require("./routes/reports"));
const suppliers_1 = __importDefault(require("./routes/suppliers"));
const upload_1 = __importDefault(require("./routes/upload"));
const categories_1 = __importDefault(require("./routes/categories"));
const customers_1 = __importDefault(require("./routes/customers"));
const stockin_1 = __importDefault(require("./routes/stockin"));
const stockout_1 = __importDefault(require("./routes/stockout"));
const paymentHistory_1 = __importDefault(require("./routes/paymentHistory"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve static files from uploads directory
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes
app.use('/api/products', products_1.default);
app.use('/api/stock', stock_1.default);
app.use('/api/sales', sales_1.default);
app.use('/api/purchases', purchases_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/suppliers', suppliers_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/customers', customers_1.default);
app.use('/api/stockin', stockin_1.default);
app.use('/api/stockout', stockout_1.default);
app.use('/api/payment-history', paymentHistory_1.default);
// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockmanagement';
mongoose_1.default.connect(MONGODB_URI, { serverSelectionTimeoutMS: 30000 })
    .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error('MongoDB connection error:', error);
});
exports.default = app;
