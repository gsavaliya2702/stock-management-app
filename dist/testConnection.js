"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockmanagement';
const testConnection = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('MongoDB connection successful!');
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('MongoDB connection closed.');
    }
};
testConnection();
