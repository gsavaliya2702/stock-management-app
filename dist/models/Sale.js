"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const saleSchema = new mongoose_1.default.Schema({
    productId: { type: String, required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    customerName: { type: String, required: true },
    discountApplied: { type: Number, default: 0 }
}, {
    timestamps: true
});
const Sale = mongoose_1.default.model('Sale', saleSchema);
exports.default = Sale;
