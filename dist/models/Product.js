"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const productSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    categoryId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Category', required: true },
    unit: { type: String, required: true },
    pricePerUnit: { type: Number, required: true },
    stockQuantity: { type: Number, required: true, default: 0 },
    expiryDate: { type: Date },
    supplierId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Supplier' },
    image: { type: String }
}, {
    timestamps: true
});
const Product = mongoose_1.default.model('Product', productSchema);
exports.default = Product;
