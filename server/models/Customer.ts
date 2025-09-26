import mongoose from 'mongoose';

interface ICustomer {
  customer_name: string;
  contact_number?: string;
  address?: string;
}

const customerSchema = new mongoose.Schema({
  customer_name: { type: String, required: true },
  contact_number: { type: String, required: false },
  address: { type: String, required: false }
}, {
  timestamps: true
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
