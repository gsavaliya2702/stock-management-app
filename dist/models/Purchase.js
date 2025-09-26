"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const purchaseSchema = new mongoose_1.default.Schema({
    productId: { type: String, required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    supplierName: { type: String, required: true },
    supplierId: { type: String, required: true },
    deliveryDate: { type: Date },
    qualityRating: { type: Number, min: 1, max: 5 },
    paymentTransactionId: { type: String },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }
}, {
    timestamps: true
});
const Purchase = mongoose_1.default.model('Purchase', purchaseSchema);
exports.default = Purchase;
