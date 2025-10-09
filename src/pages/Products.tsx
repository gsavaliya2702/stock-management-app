import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormControl,
  InputLabel,
  FormHelperText,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StockService from '../services/stockService';
import { Product } from '../types';

// Define interfaces for backend models
interface Category {
  _id: string;
  category_name: string;
}

interface Supplier {
  _id: string;
  supplier_name: string;
  contact_number: string;
  address: string;
}

const Products = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  // Suppliers filtered according to the entered product name
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    name: '',
    category: '',       // Display name
    categoryId: '',     // Actual ID sent to API
    unit: '',
    price: 0 as number | string, // Allow string for empty input handling
    expiryDays: '',     // Number of days until expiry
    supplierId: '',     // Will be populated from first supplier
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const fetchCategories = async () => {
          try {
            const response = await fetch('http://localhost:5000/api/categories');
            if (!response.ok) {
              throw new Error('Failed to fetch categories');
            }
            const data = await response.json();
            console.log('Categories loaded:', data);
            return data;
          } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
          }
        };
        
        // Fetch suppliers
        const fetchSuppliers = async () => {
          try {
            const response = await fetch('http://localhost:5000/api/suppliers');
            if (!response.ok) {
              throw new Error('Failed to fetch suppliers');
            }
            const data = await response.json();
            console.log('Suppliers loaded:', data);
            return data;
          } catch (error) {
            console.error('Error fetching suppliers:', error);
            return [];
          }
        };
        
        // Fetch all data in parallel
        const [categoryData, supplierData, productData] = await Promise.all([
          fetchCategories(),
          fetchSuppliers(),
          StockService.getProducts()
        ]);
        
        // Check if we actually have categories
        if (categoryData.length === 0) {
          console.warn('No categories found. Creating default categories...');
          
          // Create default categories if none exist
          try {
            await Promise.all([
              fetch('http://localhost:5000/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category_name: 'Fruit' })
              }),
              fetch('http://localhost:5000/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category_name: 'Vegetable' })
              }),
              fetch('http://localhost:5000/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category_name: 'Herb' })
              })
            ]);
            
            // Re-fetch categories
            const updatedCategories = await fetchCategories();
            console.log('Created default categories:', updatedCategories);
            setCategories(updatedCategories);
          } catch (error) {
            console.error('Failed to create default categories:', error);
            setCategories([]);
          }
        } else {
          setCategories(categoryData);
        }
        
  // Set suppliers without creating defaults
  setSuppliers(supplierData);
  // Initialize filtered suppliers to the full list
  setFilteredSuppliers(supplierData);
        
        setProducts(productData);
        
        // Set default supplier ID if available
        if (supplierData.length > 0) {
          setFormData(prev => ({
            ...prev,
            supplierId: supplierData[0]._id
          }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing data:', error);
        setLoading(false);
        setSnackbar({
          open: true,
          message: 'Failed to load data. Please refresh the page.',
          severity: 'error'
        });
      }
    };
    
    initializeData();
  }, []);

  // Compute filtered suppliers based on the product name that the user types.
  useEffect(() => {
    const name = (formData.name || '').trim().toLowerCase();

    if (!name) {
      setFilteredSuppliers(suppliers);
      return;
    }

    const matchingSupplierIds = new Set<string>();
    const normalizedName = name;

    products.forEach(p => {
      if (!p.name) return;
      const productName = String(p.name).trim().toLowerCase();

      // Accept exact, contains, or reverse contains matches for flexibility
      if (
        productName === normalizedName ||
        productName.includes(normalizedName) ||
        normalizedName.includes(productName)
      ) {
        const sid = p.supplierId && typeof p.supplierId === 'object'
          ? (p.supplierId._id || p.supplierId.id || '')
          : p.supplierId || '';
        if (sid) matchingSupplierIds.add(String(sid));
      }
    });

    if (matchingSupplierIds.size > 0) {
      const filtered = suppliers.filter(s => matchingSupplierIds.has(s._id));
      setFilteredSuppliers(filtered);

      // If exactly one supplier matches, auto-select it for convenience
      if (filtered.length === 1) {
        setFormData(prev => ({ ...prev, supplierId: filtered[0]._id }));
      }
    } else {
      // No matches found in existing products -> show all suppliers
      setFilteredSuppliers(suppliers);
    }
  }, [formData.name, suppliers, products]);

  const fetchProducts = async () => {
    try {
      const data = await StockService.getProducts();
      console.log('Products received from API:', data);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setSnackbar({
        open: true,
        message: 'Failed to refresh products list',
        severity: 'error'
      });
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      
      // Calculate days until expiry if expiryDate exists
      let daysUntilExpiry = '';
      if (product.expiryDate) {
        const expiryDate = product.expiryDate ? new Date(product.expiryDate) : new Date();
        const diffTime = expiryDate.getTime() - Date.now();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Only use positive values
        if (diffDays > 0) {
          daysUntilExpiry = String(diffDays);
        }
      }
      
      setFormData({
        name: product.name,
        category: product.category || '',
        categoryId: product.categoryId || '', // Use actual categoryId
        unit: product.unit,
        price: product.pricePerUnit || product.price || 0, // Use either pricePerUnit or price
        expiryDays: daysUntilExpiry,
        supplierId: product.supplierId || (suppliers.length > 0 ? suppliers[0]._id : '')
      });
    } else {
      // For a new product, set default values
      setEditingProduct(null);
      
      // Set default values with proper error handling
      let defaultCategoryId = '';
      let defaultCategoryName = '';
      let defaultSupplierId = '';
      
      // Get the first category if available
      if (categories && categories.length > 0) {
        const firstCategory = categories[0];
        defaultCategoryId = firstCategory._id || '';
        defaultCategoryName = firstCategory.category_name || '';
        console.log('Using default category:', defaultCategoryName, 'with ID:', defaultCategoryId);
      } else {
        console.warn('No categories available for selection!');
      }
      
      // Get the first supplier if available
      if (suppliers && suppliers.length > 0) {
        defaultSupplierId = suppliers[0]._id || '';
        console.log('Using default supplier ID:', defaultSupplierId);
      } else {
        console.warn('No suppliers available for selection!');
      }
      
      setFormData({
        name: '',
        category: defaultCategoryName,
        categoryId: defaultCategoryId,
        unit: 'kg', // Set a sensible default unit
        price: '' as string | number, // Start with empty string for better UX
        expiryDays: '',
        supplierId: defaultSupplierId
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      // Store the raw input value to allow for empty fields during editing
      setFormData({
        ...formData,
        [name]: value === '' ? '' : parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    
    if (name === 'category') {
      // When category is selected, find and set the categoryId
      const selectedCategory = categories.find(cat => cat.category_name === value);
      setFormData({
        ...formData,
        category: value,
        categoryId: selectedCategory?._id || ''
      });
    } else if (name === 'categoryId') {
      // When categoryId is selected directly, set the category name too
      const selectedCategory = categories.find(cat => cat._id === value);
      setFormData({
        ...formData,
        categoryId: value,
        category: selectedCategory?.category_name || ''
      });
    } else if (name === 'supplierId') {
      // Just set the supplierId
      setFormData({
        ...formData,
        supplierId: value
      });
    } else {
      // For other selects like unit
      setFormData({
        ...formData,
        [name as string]: value,
      });
    }
  };

  // Image-related handlers have been removed

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.name) {
        setSnackbar({ open: true, message: 'Product name is required', severity: 'error' });
        return;
      }
      
      if (!formData.categoryId) {
        setSnackbar({ open: true, message: 'Category is required', severity: 'error' });
        return;
      }
      
      if (!formData.unit) {
        setSnackbar({ open: true, message: 'Unit is required', severity: 'error' });
        return;
      }
      
      if (!formData.supplierId) {
        setSnackbar({ open: true, message: 'Supplier is required', severity: 'error' });
        return;
      }
      
      // Log the form data for debugging
      console.log('Form data before submission:', formData);
      
      // Prepare data for submission - match backend field names
      const submittableData = {
        name: formData.name,
        categoryId: formData.categoryId, // Use the actual ID, not the name
        unit: formData.unit,
        price: formData.price === '' ? 0 : Number(formData.price), // Keep price for frontend type compatibility
        pricePerUnit: formData.price === '' ? 0 : Number(formData.price), // Add pricePerUnit for backend
        // Set stockQuantity explicitly to ensure it's never missing
        stockQuantity: editingProduct?.stockQuantity !== undefined ? editingProduct.stockQuantity : 0,
        // Convert expiryDays to a number if present
        expiryDays: formData.expiryDays ? Number(formData.expiryDays) : undefined,
        // Include supplierId
        supplierId: formData.supplierId
      };
      
      console.log('Submitting data:', submittableData);
      
      if (editingProduct) {
        // Update existing product
        await StockService.updateProduct(editingProduct.id, submittableData);
        setSnackbar({ open: true, message: 'Product updated successfully!', severity: 'success' });
      } else {
        // Add new product
        await StockService.addProduct(submittableData);
        setSnackbar({ open: true, message: 'Product added successfully!', severity: 'success' });
      }
      
      handleCloseDialog();
      fetchProducts();
    } catch (error: any) {
      // Log form data and detailed error
      console.error('Error saving product:', formData, error);
      // Show actual error message if available
      const errorMessage = error.message || 'Error saving product';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await StockService.deleteProduct(id);
      setSnackbar({ open: true, message: 'Product deleted successfully!', severity: 'success' });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setSnackbar({ open: true, message: 'Error deleting product', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Typography variant="h4">
          Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Product
        </Button>
      </div>
      
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Price ($)</TableCell>
                  <TableCell>Days Until Expiry</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product: any) => (
                  <TableRow key={product.id || product._id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      {/* Display category_name from populated data or fallback to category */}
                      {product.categoryId?.category_name || product.category || 'Unknown'}
                    </TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>
                      {/* Use pricePerUnit or price */}
                      {(product.pricePerUnit || product.price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {product.expiryDate ? 
                        (() => {
                          const days = product.expiryDate ? Math.ceil((new Date(product.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
                          return days > 0 ? `${days} days` : 'Expired';
                        })() : 
                        'N/A'}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenDialog(product)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="secondary" 
                        onClick={() => handleDelete(product.id || product._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Product Name"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            style={{ marginTop: '10px' }}
          />
          <FormControl fullWidth style={{ marginTop: '10px' }}>
            <InputLabel>Category</InputLabel>
            <Select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleSelectChange}
              error={formData.categoryId === ''}
            >
              {categories.length === 0 ? (
                <MenuItem value="" disabled>
                  No categories available
                </MenuItem>
              ) : (
                categories.map(category => {
                  console.log('Rendering category option:', category);
                  return (
                    <MenuItem key={category._id} value={category._id}>
                      {category.category_name}
                    </MenuItem>
                  );
                })
              )}
            </Select>
            {formData.categoryId === '' && (
              <FormHelperText error>Category is required</FormHelperText>
            )}
            <FormHelperText>
              {categories.length === 0 ? 'Loading categories...' : `${categories.length} categories available`}
            </FormHelperText>
          </FormControl>
          <FormControl fullWidth style={{ marginTop: '10px' }}>
            <InputLabel>Unit</InputLabel>
            <Select
              name="unit"
              value={formData.unit}
              onChange={handleSelectChange}
            >
              <MenuItem value="Kg">Kilogram (kg)</MenuItem>
              <MenuItem value="Piece">Piece</MenuItem>
              <MenuItem value="Bunch">Bunch</MenuItem>
              <MenuItem value="Pack">Pack</MenuItem>
              <MenuItem value="Box">Box</MenuItem>
              <MenuItem value="Tray">Tray</MenuItem>
              <MenuItem value="Punnets">Punnets</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="price"
            label="Price ($)"
            type="number"
            fullWidth
            value={formData.price === '' ? '' : formData.price}
            onChange={handleInputChange}
            inputProps={{ min: 0, step: "0.01" }}
            style={{ marginTop: '10px' }}
          />
          <TextField
            margin="dense"
            name="expiryDays"
            label="Days Until Expiry"
            type="number"
            fullWidth
            value={formData.expiryDays}
            onChange={handleInputChange}
            style={{ marginTop: '10px' }}
            inputProps={{ min: 0 }}
            helperText="Enter number of days until expiry (for perishable products)"
          />
          
          <FormControl fullWidth style={{ marginTop: '10px' }}>
            <InputLabel>Supplier</InputLabel>
            <Select
              name="supplierId"
              value={formData.supplierId}
              onChange={handleSelectChange}
              error={formData.supplierId === ''}
            >
              {filteredSuppliers.length === 0 ? (
                <MenuItem value="" disabled>
                  No suppliers available
                </MenuItem>
              ) : (
                filteredSuppliers.map(supplier => (
                  <MenuItem key={supplier._id} value={supplier._id}>
                    {supplier.supplier_name}
                  </MenuItem>
                ))
              )}
            </Select>
            {formData.supplierId === '' && (
              <FormHelperText error>Supplier is required</FormHelperText>
            )}
          </FormControl>

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProduct ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity as any}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Products;