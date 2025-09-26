"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const paymentHistorySchema = new mongoose_1.default.Schema({
    transactionId: { type: String, required: true, unique: true },
    purchaseId: { type: String, ref: 'Purchase' },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: {
        type: String,
        enum: ['success', 'failed', 'pending', 'refunded'],
        default: 'pending'
    },
    date: { type: Date, default: Date.now },
    message: { type: String },
    metadata: { type: mongoose_1.default.Schema.Types.Mixed }
}, {
    timestamps: true
});
const PaymentHistory = mongoose_1.default.model('PaymentHistory', paymentHistorySchema);
exports.default = PaymentHistory;
