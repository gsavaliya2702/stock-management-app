"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const stockInSchema = new mongoose_1.default.Schema({
    product_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Product', required: true },
    supplier_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    quantity: { type: Number, required: true },
    date_received: { type: Date, default: Date.now, required: true },
    date_expected: { type: Date, required: true }
}, {
    timestamps: true
});
const StockIn = mongoose_1.default.model('StockIn', stockInSchema);
exports.default = StockIn;
