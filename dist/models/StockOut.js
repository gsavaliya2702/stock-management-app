"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const stockOutSchema = new mongoose_1.default.Schema({
    product_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Product', required: true },
    customer_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Customer', required: true },
    quantity: { type: Number, required: true },
    date_dispatched: { type: Date, default: Date.now, required: true }
}, {
    timestamps: true
});
const StockOut = mongoose_1.default.model('StockOut', stockOutSchema);
exports.default = StockOut;
