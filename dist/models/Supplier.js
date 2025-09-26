"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const supplierSchema = new mongoose_1.default.Schema({
    supplier_name: { type: String, required: true },
    contact_number: { type: String, required: true },
    address: { type: String, required: true },
    // Keep performance metrics from original design
    performanceScore: { type: Number, default: 0 },
    deliverySpeedAvg: { type: Number, default: 0 },
    qualityRatingAvg: { type: Number, default: 0 },
    reliabilityScore: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 }
}, {
    timestamps: true
});
const Supplier = mongoose_1.default.model('Supplier', supplierSchema);
exports.default = Supplier;
