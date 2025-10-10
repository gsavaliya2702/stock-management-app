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
  SelectChangeEvent,
  Rating,
  Switch,
  FormControlLabel,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptIcon from '@mui/icons-material/Receipt';
import StockService from '../services/stockService';
import SupplierService from '../services/supplierService';
import PaymentService from '../services/paymentService';
import PaymentHistoryService from '../services/paymentHistoryService';
import { Product, Purchase, Supplier } from '../types';

// Extended type to include payment fields
interface ExtendedPurchase extends Purchase {
  paymentTransactionId?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
}

const Purchases = () => {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<ExtendedPurchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  
  // Ref to store active timeout IDs for cleanup
  const activeTimeouts = useRef<{[key: string]: number}>({});
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<ExtendedPurchase | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1 as number | string, // Allow string for empty input handling
    supplierName: '',
    supplierId: '',
    deliveryDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    qualityRating: 5, // Default to highest rating
    processPayment: false, // Whether to process payment immediately
    totalCost: 0 as number | string, // Allow string for empty input handling
  });

  useEffect(() => {
    const fetchData = async () => {
      await fetchPurchasesData();
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

  const fetchPurchasesData = async () => {
    try {
      const purchasesData = await StockService.getPurchases();
      const productsData = await StockService.getProducts();
      const suppliersData = await SupplierService.getSuppliers();
      
      setPurchases(purchasesData);
      setProducts(productsData);
      setSuppliers(suppliersData);
  setFilteredSuppliers(suppliersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching purchases data:', error);
      setLoading(false);
    }
  };

  const handleOpenDialog = (purchase?: ExtendedPurchase) => {
    if (purchase) {
      // Editing existing purchase
      setEditingPurchase(purchase);
      // Calculate total cost
      const selectedProduct = products.find(p => p.id === purchase.productId);
      const estimatedCost = selectedProduct ? (selectedProduct.pricePerUnit || 0) * purchase.quantity : 0;
      
      setFormData({
        productId: purchase.productId || '',
        quantity: purchase.quantity || 1,
        supplierName: purchase.supplierName || '',
        supplierId: purchase.supplierId || '',
        deliveryDate: purchase.deliveryDate 
          ? new Date(purchase.deliveryDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        qualityRating: purchase.qualityRating || 5,
        processPayment: false,
        totalCost: estimatedCost
      });
    } else {
      // Creating new purchase
      setEditingPurchase(null);
      setFormData({
        productId: '',
        quantity: 1,
        supplierName: '',
        supplierId: '',
        deliveryDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        qualityRating: 5, // Default to highest rating
        processPayment: false,
        totalCost: 0
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPurchase(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'quantity') {
      handleQuantityChange(e);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  const handleRatingChange = (newValue: number | null) => {
    setFormData({
      ...formData,
      qualityRating: newValue || 5,
    });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    
    // If supplier is selected, also update supplierName for backward compatibility
    if (name === 'supplierId' && value) {
      const selectedSupplier = suppliers.find(s => s.id === value);
      setFormData({
        ...formData,
        [name]: value,
        supplierName: selectedSupplier?.name || ''
      });
    } else if (name === 'productId' && value) {
      // Update total cost estimate when product is selected
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        // Convert quantity to number for calculation
        const quantityNum = typeof formData.quantity === 'string' ? 
          (formData.quantity === '' ? 1 : Number(formData.quantity) || 0) : formData.quantity;
        const estimatedCost = (selectedProduct.pricePerUnit || 0) * quantityNum;
        setFormData({
          ...formData,
          [name]: value,
          totalCost: estimatedCost
        });
      } else {
        setFormData({
          ...formData,
          [name as string]: value,
        });
      }
    } else {
      setFormData({
        ...formData,
        [name as string]: value,
      });
    }
  };

  // Recompute filteredSuppliers whenever selected product, products list, or suppliers list changes
  useEffect(() => {
    const productId = formData.productId;

    if (!productId) {
      setFilteredSuppliers(suppliers);
      return;
    }

    // Prefer purchase history: find suppliers who have supplied this product before
    const matchingSupplierIds = new Set<string>();

    purchases.forEach(pur => {
      if (!pur.productId) return;
      if (pur.productId === productId && pur.supplierId) {
        matchingSupplierIds.add(String(pur.supplierId));
      }
    });

    if (matchingSupplierIds.size > 0) {
      const filtered = suppliers.filter(s => matchingSupplierIds.has(s.id));
      setFilteredSuppliers(filtered);
      if (filtered.length === 1) {
        setFormData(prev => ({ ...prev, supplierId: filtered[0].id, supplierName: filtered[0].name }));
      }
      return;
    }

    // Fallback: try matching by product name across products (less reliable)
    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) {
      setFilteredSuppliers(suppliers);
      return;
    }

    const productName = (selectedProduct.name || '').trim().toLowerCase();
    products.forEach(p => {
      if (!p.name) return;
      const pn = String(p.name).trim().toLowerCase();
      if (pn === productName || pn.includes(productName) || productName.includes(pn)) {
        const supplierField: any = (p as any).supplierId;
        const sid = supplierField && typeof supplierField === 'object'
          ? (supplierField._id || supplierField.id || '')
          : (supplierField || '');
        if (sid) matchingSupplierIds.add(String(sid));
      }
    });

    if (matchingSupplierIds.size > 0) {
      const filtered = suppliers.filter(s => matchingSupplierIds.has(s.id));
      setFilteredSuppliers(filtered);
      if (filtered.length === 1) {
        setFormData(prev => ({ ...prev, supplierId: filtered[0].id, supplierName: filtered[0].name }));
      }
    } else {
      setFilteredSuppliers(suppliers);
    }
  }, [formData.productId, products, suppliers]);
  
  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.checked,
    });
  };
  
  // Update quantity and recalculate cost
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    // Store the raw string value to allow for proper input manipulation
    setFormData({
      ...formData,
      quantity: value,
    });
  };

  const handleSubmit = async () => {
    try {
      const selectedProduct = products.find(p => p.id === formData.productId);
      if (!selectedProduct) {
        setSnackbar({ open: true, message: 'Please select a product', severity: 'error' });
        return;
      }
      
      // Ensure quantity is a valid number > 0
      const submittableQuantity = typeof formData.quantity === 'string'
        ? (formData.quantity === '' ? 1 : parseInt(formData.quantity) || 1)
        : formData.quantity;
        
      if (submittableQuantity <= 0) {
        setSnackbar({ open: true, message: 'Quantity must be greater than 0', severity: 'error' });
        return;
      }
      
      // Make supplier required
      if (!formData.supplierId) {
        setSnackbar({ open: true, message: 'Please select a supplier', severity: 'error' });
        return;
      }
      
      // Calculate total price based on product price and quantity
      // Use the previously validated quantity for consistency
      const totalPrice = (selectedProduct.pricePerUnit || 0) * submittableQuantity;
      
      // Process payment if option is selected
      let paymentTransactionId = undefined;
      let paymentStatus = 'pending';
      
      if (formData.processPayment && totalPrice > 0) {
        try {
          setSnackbar({ open: true, message: 'Processing payment...', severity: 'info' });
          
          const paymentResult = await PaymentService.processPayment(
            totalPrice, 
            'cash' // Default to cash payment for simplicity
          );
          
          if (!paymentResult.success) {
            setSnackbar({ 
              open: true, 
              message: paymentResult.message || 'Payment failed', 
              severity: 'error' 
            });
            return;
          }
          
          // Payment successful
          paymentTransactionId = paymentResult.transactionId;
          paymentStatus = 'paid';
          
          // Save payment record
          PaymentHistoryService.addPaymentRecord({
            id: paymentResult.transactionId,
            transactionId: paymentResult.transactionId,
            purchaseId: editingPurchase ? editingPurchase.id : '',
            date: new Date(),
            amount: totalPrice,
            status: 'success',
            paymentMethod: 'cash',
            message: 'Purchase payment'
          });
          
          setSnackbar({ 
            open: true, 
            message: 'Payment processed successfully!', 
            severity: 'success' 
          });
        } catch (error: any) {
          setSnackbar({ 
            open: true, 
            message: `Payment processing failed: ${error.message}`, 
            severity: 'error' 
          });
          return;
        }
      }
      
      // We already calculated totalPrice above, no need to recalculate
      
      const purchaseData = {
        productId: formData.productId,
        quantity: submittableQuantity,  // Use the validated numeric quantity
        supplierName: formData.supplierName,
        supplierId: formData.supplierId,
        totalPrice: totalPrice, // Include total price
        date: new Date(), // Include date
        deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : undefined,
        qualityRating: formData.qualityRating || undefined,
        paymentTransactionId,
        paymentStatus: paymentStatus as 'pending' | 'paid' | 'failed' | undefined
      };
      
      if (editingPurchase) {
        // Updating existing purchase
        await StockService.updatePurchase(editingPurchase.id, purchaseData);
        setSnackbar({ open: true, message: 'Purchase updated successfully!', severity: 'success' });
      } else {
        // Adding new purchase
        await StockService.addPurchase(purchaseData);
        setSnackbar({ open: true, message: 'Purchase recorded successfully!', severity: 'success' });
      }
      
      handleCloseDialog();
      fetchPurchasesData();
    } catch (error) {
      console.error('Error handling purchase:', error);
      setSnackbar({ 
        open: true, 
        message: editingPurchase ? 'Error updating purchase' : 'Error recording purchase', 
        severity: 'error' 
      });
    }
  };

  // Add state for delete confirmation dialog
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    purchaseId: string;
    productName: string;
  }>({ open: false, purchaseId: '', productName: '' });
  
  // Show delete confirmation dialog instead of deleting immediately
  const confirmDelete = (purchase: ExtendedPurchase) => {
    const product = getProductById(purchase.productId);
    setDeleteConfirmation({
      open: true,
      purchaseId: purchase.id,
      productName: product?.name || 'Unknown product'
    });
  };

  // Actual delete handler called after confirmation
  const handleDelete = async (id: string) => {
    if (!id) {
      console.error('Attempted to delete purchase with invalid ID:', id);
      setSnackbar({ open: true, message: 'Cannot delete: Invalid purchase ID', severity: 'error' });
      return;
    }
    
    try {
      // Show pending notification
      setSnackbar({ open: true, message: 'Deleting purchase...', severity: 'info' });
      
      console.log('Deleting purchase with ID:', id);
      
      // Create an abort controller for the fetch
      const abortController = new AbortController();
      
      // Store timeout ID in ref for potential cleanup
      const timeoutId = setTimeout(() => abortController.abort(), 10000); // 10 seconds timeout
      activeTimeouts.current[`delete_${id}`] = timeoutId as unknown as number;
      
      // Make the delete request through the service with the abort controller signal
      await StockService.deletePurchase(id, abortController.signal);
      
      // Clear the timeout and remove from active timeouts
      clearTimeout(activeTimeouts.current[`delete_${id}`]);
      delete activeTimeouts.current[`delete_${id}`];
      
      console.log('Purchase successfully deleted:', id);
      setSnackbar({ open: true, message: 'Purchase deleted successfully', severity: 'success' });
      
      // Close confirmation dialog
      setDeleteConfirmation({ open: false, purchaseId: '', productName: '' });
      
      // Remove the deleted purchase from state directly for immediate UI feedback
      setPurchases(prevPurchases => prevPurchases.filter(purchase => purchase.id !== id));
      
      // Also refresh data from server to ensure everything is in sync
      fetchPurchasesData();
    } catch (error) {
      // Clear the timeout and remove from active timeouts if it exists
      if (activeTimeouts.current[`delete_${id}`]) {
        clearTimeout(activeTimeouts.current[`delete_${id}`]);
        delete activeTimeouts.current[`delete_${id}`];
      }
      
      console.error('Error deleting purchase:', error);
      
      let errorMsg = 'Error deleting purchase';
      if (error instanceof Error) {
        errorMsg += `: ${error.message}`;
        
        // Special handling for abort errors (timeouts)
        if (error.name === 'AbortError') {
          errorMsg = 'Delete request timed out. The server might be busy.';
        }
      }
      
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
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
          Purchases
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Record Purchase
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
                  <TableCell>Supplier</TableCell>
                  <TableCell>Expected Delivery</TableCell>
                  <TableCell>Quality Rating</TableCell>
                  <TableCell>Total Price ($)</TableCell>
                  <TableCell>Payment Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchases.filter(p => p).map((purchase, index) => {
                  const product = getProductById(purchase.productId);
                  // Use purchase.id if available, otherwise fall back to index as key
                  const rowKey = purchase.id ? purchase.id : `purchase-${index}`;
                  
                  console.log('Purchase row key:', rowKey, 'Purchase ID:', purchase.id);
                  
                  return (
                    <TableRow key={rowKey}>
                      <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                      <TableCell>{product ? product.name : 'Unknown'}</TableCell>
                      <TableCell>{purchase.quantity}</TableCell>
                      <TableCell>{purchase.supplierName || 'N/A'}</TableCell>
                      <TableCell>{purchase.deliveryDate ? new Date(purchase.deliveryDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        {purchase.qualityRating ? 
                          <Rating 
                            value={purchase.qualityRating} 
                            readOnly 
                            size="small" 
                          /> : 'N/A'}
                      </TableCell>
                      <TableCell>{(purchase.totalPrice || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {purchase.paymentStatus === 'paid' ? (
                          <Chip 
                            color="success" 
                            size="small" 
                            label="Paid" 
                            icon={<ReceiptIcon />} 
                          />
                        ) : purchase.paymentStatus === 'failed' ? (
                          <Chip 
                            color="error" 
                            size="small" 
                            label="Failed" 
                          />
                        ) : (
                          <Chip 
                            color="warning" 
                            size="small" 
                            label="Pending" 
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenDialog(purchase)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          color="secondary" 
                          onClick={() => confirmDelete(purchase)}
                        >
                          <DeleteIcon />
                        </IconButton>
                        {purchase.paymentTransactionId && (
                          <IconButton 
                            color="primary"
                            onClick={() => {
                              // Generate receipt
                              const receiptData = {
                                transactionId: purchase.paymentTransactionId,
                                purchaseId: purchase.id,
                                amount: purchase.totalPrice,
                                paymentMethod: 'cash', // Default assumption
                                success: purchase.paymentStatus === 'paid',
                                date: purchase.date
                              };
                              
                              const receipt = PaymentService.generateReceipt(receiptData);
                              PaymentService.downloadReceipt(receipt, `receipt_${purchase.paymentTransactionId}.txt`);
                              
                              setSnackbar({
                                open: true,
                                message: 'Receipt downloaded',
                                severity: 'success'
                              });
                            }}
                          >
                            <ReceiptIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingPurchase ? 'Edit Purchase' : 'Record New Purchase'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth style={{ marginTop: '10px' }}>
            <InputLabel>Product</InputLabel>
            <Select
              name="productId"
              value={formData.productId}
              onChange={handleSelectChange}
            >
              {products.map((product, index) => {
                // Use product.id if available, otherwise fall back to index as key
                const itemKey = product.id ? product.id : `product-${index}`;
                
                return (
                  <MenuItem key={itemKey} value={product.id}>
                    {product.name} - ${product.pricePerUnit ? product.pricePerUnit.toFixed(2) : '0.00'}
                  </MenuItem>
                );
              })}
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
          <FormControl fullWidth style={{ marginTop: '10px' }} required>
            <InputLabel>Supplier *</InputLabel>
            <Select
              name="supplierId"
              value={formData.supplierId}
              onChange={handleSelectChange}
              error={!formData.supplierId}
            >
              <MenuItem value="">
                <em>Select a supplier</em>
              </MenuItem>
              {filteredSuppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name || supplier.supplier_name || "Unknown supplier"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            name="deliveryDate"
            label="Expected Delivery Date"
            type="date"
            fullWidth
            value={formData.deliveryDate}
            onChange={handleInputChange}
            style={{ marginTop: '10px' }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column' }}>
            <Typography component="legend">Quality Rating</Typography>
            <Rating
              name="qualityRating"
              value={formData.qualityRating}
              onChange={(event, newValue) => handleRatingChange(newValue)}
            />
          </div>
          
          {/* Payment section */}
          <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <Typography variant="h6" gutterBottom>
              Payment Details
            </Typography>
            
            <Typography variant="body1" gutterBottom>
              Estimated Cost: <b>${typeof formData.totalCost === 'number' ? 
                formData.totalCost.toFixed(2) : 
                (formData.totalCost === '' ? '0.00' : Number(formData.totalCost).toFixed(2))}</b>
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.processPayment}
                  onChange={handleSwitchChange}
                  name="processPayment"
                  color="primary"
                />
              }
              label="Process Payment Immediately"
            />
            
            {formData.processPayment && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Payment will be processed upon submission using Cash payment method.
              </Alert>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPurchase ? 'Update Purchase' : 'Record Purchase'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, purchaseId: '', productName: '' })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this purchase of <strong>{deleteConfirmation.productName}</strong>?
            <br /><br />
            This action will reduce the stock quantity and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmation({ open: false, purchaseId: '', productName: '' })}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleDelete(deleteConfirmation.purchaseId)} 
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

export default Purchases;