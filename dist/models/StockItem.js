"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const stockItemSchema = new mongoose_1.default.Schema({
    productId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    quantity: { type: Number, required: true, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    minStockLevel: { type: Number, required: true, default: 10 },
    location: { type: String }
}, {
    timestamps: true
});
const StockItem = mongoose_1.default.model('StockItem', stockItemSchema);
exports.default = StockItem;
