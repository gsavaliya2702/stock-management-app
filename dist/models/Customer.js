"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const customerSchema = new mongoose_1.default.Schema({
    customer_name: { type: String, required: true },
    contact_number: { type: String, required: false },
    address: { type: String, required: false }
}, {
    timestamps: true
});
const Customer = mongoose_1.default.model('Customer', customerSchema);
exports.default = Customer;
