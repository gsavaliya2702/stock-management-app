import React, { useEffect, useState } from 'react';
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
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import StockService from '../services/stockService';
import { Product, StockItem } from '../types';

const StockTracking = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newQuantity, setNewQuantity] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      const productsData = await StockService.getProducts();
      const stockData = await StockService.getStockItems();
      
      setProducts(productsData);
      setStockItems(stockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setLoading(false);
    }
  };

  const handleOpenDialog = (productId: string, currentQuantity: number) => {
    console.log('Opening dialog for product ID:', productId);
    setSelectedProductId(productId);
    setNewQuantity(currentQuantity);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProductId('');
  };

  const handleUpdateStock = async () => {
    if (newQuantity < 0) {
        setSnackbar({ open: true, message: 'Quantity must be a positive number', severity: 'error' });
        return;
    }
    try {
      console.log('Selected product ID before update:', selectedProductId);
      
      // Check if selectedProductId is undefined or null
      if (!selectedProductId) {
        throw new Error('Product ID is undefined or null');
      }
      
      // Extract MongoDB ObjectID from selectedProductId if it contains the full format
      let productIdToUse = selectedProductId;
      if (typeof selectedProductId === 'string' && selectedProductId.includes('ObjectId')) {
        // Extract just the ID portion from the string if it's in format: ObjectId('...')
        const matches = selectedProductId.match(/'([^']+)'/);
        if (matches && matches[1]) {
          productIdToUse = matches[1];
          console.log('Extracted ObjectId:', productIdToUse);
        }
      }
      
      await StockService.updateStock(productIdToUse, newQuantity);
      setSnackbar({ open: true, message: 'Stock updated successfully!', severity: 'success' });
      handleCloseDialog();
      fetchStockData();
    } catch (error) {
      console.error('Error updating stock:', error);
      let errorMsg = 'Error updating stock';
      if (error instanceof Error) {
        errorMsg += `: ${error.message}`;
      }
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    }
  };

  

  const getStockItemByProductId = (productId: string) => {
    return stockItems.find(item => item.productId === productId);
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
      <Typography variant="h4" gutterBottom>
        Stock Tracking
      </Typography>
      
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Min Stock Level</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => {
                  const stockItem = getStockItemByProductId(product.id);
                  const isLowStock = stockItem && stockItem.quantity <= stockItem.minStockLevel;
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category || 'No Category'}</TableCell>
                      <TableCell>{stockItem ? stockItem.quantity : 0} {product.unit}</TableCell>
                      <TableCell>{stockItem ? stockItem.minStockLevel : 10} {product.unit}</TableCell>
                      <TableCell>
                        {isLowStock ? (
                          <Chip label="Low Stock" color="secondary" size="small" />
                        ) : (
                          <Chip label="In Stock" color="primary" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {stockItem ? new Date(stockItem.lastUpdated).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenDialog(
                            product.id, 
                            stockItem ? stockItem.quantity : 0
                          )}
                        >
                          Update
                        </Button>
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
        <DialogTitle>Update Stock</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Quantity"
            type="number"
            fullWidth
            value={newQuantity}
            onChange={(e) => setNewQuantity(Number(e.target.value))}
            style={{ marginTop: '10px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleUpdateStock} variant="contained">
            Update
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

export default StockTracking;
