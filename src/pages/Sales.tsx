import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  IconButton,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StockService from '../services/stockService';
import { Product, Sale } from '../types';

const Sales = () => {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1 as number | string, // Allow string for empty input handling
    customerName: '',
    contactNumber: '',
    address: '',
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Ref to store active timeout IDs for cleanup
  const activeTimeouts = useRef<{[key: string]: number}>({});

  useEffect(() => {
    const fetchData = async () => {
      await fetchSalesData();
    };
    
    fetchData();
    
    // Cleanup function to handle any pending timeouts when component unmounts
    return () => {
      // Clear all active timeouts to prevent memory leaks
      Object.keys(activeTimeouts.current).forEach(key => {
        clearTimeout(activeTimeouts.current[key]);
        console.log(`Cleaned up timeout: ${key}`);
      });
      console.log('Cleaned up all pending operations on component unmount');
    };
  }, []);

  const fetchSalesData = async () => {
    try {
      const [salesRes, productsRes] = await Promise.allSettled([
        StockService.getSales(),
        StockService.getProducts()
      ]);
      
      if (salesRes.status === 'fulfilled') {
        setSales(salesRes.value);
      } else {
        console.error('Error fetching sales:', salesRes.reason);
        setSales([]);
      }
      
      if (productsRes.status === 'fulfilled') {
        setProducts(productsRes.value);
      } else {
        console.error('Error fetching products:', productsRes.reason);
        setProducts([]);
      }
    } catch (error) {
      console.error('Unexpected error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      productId: '',
      quantity: 1,
      customerName: '',
      contactNumber: '',
      address: '',
    });
    setHasSubmitted(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'quantity') {
      // Store the raw string value to allow for proper input manipulation
      setFormData({
        ...formData,
        [name]: value,
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
    setFormData({
      ...formData,
      [name as string]: value,
    });
  };

  const handleSubmit = async () => {
    setHasSubmitted(true);
    try {
      const selectedProduct = products.find(p => p.id === formData.productId);
      if (!selectedProduct) {
        setSnackbar({ open: true, message: 'Please select a product', severity: 'error' });
        return;
      }
      
      // Ensure quantity is a valid number > 0
      const submittableQuantity = typeof formData.quantity === 'string' && formData.quantity === '' 
        ? 1 
        : Number(formData.quantity);
        
      if (submittableQuantity <= 0) {
        setSnackbar({ open: true, message: 'Quantity must be greater than 0', severity: 'error' });
        return;
      }
      
      // Make customer name required
      if (!formData.customerName) {
        setSnackbar({ open: true, message: 'Please enter a customer name', severity: 'error' });
        return;
      }
      
      // Debug log (simplified to avoid extra processing)
      console.log('Attempting to record sale:', {
        productId: formData.productId,
        quantity: submittableQuantity,
        customerName: formData.customerName
      });
      
      // Include all required fields for sale - let backend calculate totalPrice
      await StockService.addSale({
        productId: formData.productId,
        quantity: submittableQuantity,  // Use the validated numeric quantity
        customerName: formData.customerName,
        contactNumber: formData.contactNumber,
        address: formData.address,
        date: new Date(),
        discountApplied: 0 // Default to no discount
      });
      
      setSnackbar({ open: true, message: 'Sale recorded successfully!', severity: 'success' });
      handleCloseDialog();
      fetchSalesData();
    } catch (error) {
      console.error('Error recording sale:', error);
      try {
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown',
          stack: error instanceof Error ? error.stack : 'Unknown'
        });
      } catch (loggingError) {
        console.error('Error logging error details:', loggingError);
      }
      setSnackbar({ open: true, message: `Error recording sale: ${error instanceof Error ? error.message : 'Unknown error'}`, severity: 'error' });
    }
  };

  // Add state for delete confirmation dialog
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    saleId: string;
    productName: string;
  }>({ open: false, saleId: '', productName: '' });
  
  // Show delete confirmation dialog instead of deleting immediately
  const confirmDelete = (sale: Sale) => {
    setDeleteConfirmation({
      open: true,
      saleId: sale._id,
      productName: sale.productName || 'Unknown product'
    });
  };
  
  // Handle actual deletion after confirmation
  const handleDelete = async (id: string) => {
    if (!id) {
      console.error('Attempted to delete sale with invalid ID:', id);
      setSnackbar({ open: true, message: 'Cannot delete: Invalid sale ID', severity: 'error' });
      return;
    }

    try {
      console.log('Attempting to delete sale with ID:', id);
      
      // Show pending notification
      setSnackbar({ open: true, message: 'Deleting sale...', severity: 'info' });
      
      // Create an abort controller for the fetch
      const abortController = new AbortController();
      
      // Store timeout ID in ref for potential cleanup
      const timeoutId = setTimeout(() => abortController.abort(), 10000); // 10 seconds timeout
      activeTimeouts.current[`delete_${id}`] = timeoutId as unknown as number;
      
      // Make the delete request through the service with the abort controller signal
      await StockService.deleteSale(id, abortController.signal);
      
      // Clear the timeout and remove from active timeouts
      clearTimeout(activeTimeouts.current[`delete_${id}`]);
      delete activeTimeouts.current[`delete_${id}`];
      
      console.log('Sale successfully deleted:', id);
      setSnackbar({ open: true, message: 'Sale deleted successfully', severity: 'success' });
      
      // Close confirmation dialog
      setDeleteConfirmation({ open: false, saleId: '', productName: '' });
      
      // Remove the deleted sale from state directly for immediate UI feedback
      setSales(prevSales => prevSales.filter(sale => sale._id !== id));
      
      // Also refresh data from server to ensure everything is in sync
      fetchSalesData();
    } catch (error) {
      // Clear the timeout and remove from active timeouts if it exists
      if (activeTimeouts.current[`delete_${id}`]) {
        clearTimeout(activeTimeouts.current[`delete_${id}`]);
        delete activeTimeouts.current[`delete_${id}`];
      }
      
      console.error('Error deleting sale:', error);
      
      // Get specific error message if available
      let errorMessage = 'Error deleting sale';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
        
        // Special handling for abort errors (timeouts)
        if (error.name === 'AbortError') {
          errorMessage = 'Delete request timed out. The server might be busy.';
        }
      }
      
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
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
          Sales
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Record Sale
        </Button>
      </div>
      
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Total Price ($)</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale._id}>
                    <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                    <TableCell>{sale.productName || 'Unknown'}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>{sale.customerName || 'N/A'}</TableCell>
                    <TableCell>{sale.totalPrice ? sale.totalPrice.toFixed(2) : '0.00'}</TableCell>
                    <TableCell>
                      <IconButton
                        color="secondary"
                        onClick={() => confirmDelete(sale)}
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
        <DialogTitle>Record New Sale</DialogTitle>
        <DialogContent>
          <FormControl fullWidth style={{ marginTop: '10px' }}>
            <InputLabel>Product</InputLabel>
            <Select
              name="productId"
              value={formData.productId}
              onChange={handleSelectChange}
            >
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="quantity"
            label="Quantity"
            type="number"
            fullWidth
            value={formData.quantity === '' ? '' : formData.quantity}
            onChange={handleInputChange}
            style={{ marginTop: '10px' }}
            inputProps={{ min: 0 }}
          />
          <TextField
            margin="dense"
            name="customerName"
            label="Customer Name *"
            fullWidth
            value={formData.customerName}
            onChange={handleInputChange}
            style={{ marginTop: '10px' }}
            required
            error={hasSubmitted && !formData.customerName}
            helperText={hasSubmitted && !formData.customerName ? "Customer name is required" : ""}
          />
          <TextField
            margin="dense"
            name="contactNumber"
            label="Contact Number"
            fullWidth
            value={formData.contactNumber}
            onChange={handleInputChange}
            style={{ marginTop: '10px' }}
          />
          <TextField
            margin="dense"
            name="address"
            label="Address"
            fullWidth
            value={formData.address}
            onChange={handleInputChange}
            style={{ marginTop: '10px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Record Sale
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, saleId: '', productName: '' })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this sale of <strong>{deleteConfirmation.productName}</strong>?
            <br /><br />
            This action will restore the stock quantity and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmation({ open: false, saleId: '', productName: '' })}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleDelete(deleteConfirmation.saleId)} 
            color="error" 
            variant="contained"
          >
            Delete
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

export default Sales;