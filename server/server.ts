import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import productRoutes from './routes/products';
import stockRoutes from './routes/stock';
import salesRoutes from './routes/sales';
import purchasesRoutes from './routes/purchases';
import reportsRoutes from './routes/reports';
import suppliersRoutes from './routes/suppliers';
import uploadRoutes from './routes/upload';
import categoriesRoutes from './routes/categories';
import customersRoutes from './routes/customers';
import stockinRoutes from './routes/stockin';
import stockoutRoutes from './routes/stockout';
import paymentHistoryRoutes from './routes/paymentHistory';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/stockin', stockinRoutes);
app.use('/api/stockout', stockoutRoutes);
app.use('/api/payment-history', paymentHistoryRoutes);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockmanagement';

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 30000 })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

export default app;
