import mongoose from 'mongoose';

interface ICategory {
  category_name: string;
}

const categorySchema = new mongoose.Schema({
  category_name: { type: String, required: true, unique: true }
}, {
  timestamps: true
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
