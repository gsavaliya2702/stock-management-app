import React, { useEffect, useState } from 'react';
import {
  Grid,
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
  Alert,
  Chip
} from '@mui/material';
import StockService from '../services/stockService';
import { Product, StockAlert } from '../types';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<StockAlert[]>([]);
  const [stockValue, setStockValue] = useState(0);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const productsData = await StockService.getProducts();
      const alerts = await StockService.getLowStockAlerts();
      const value = await StockService.getStockValue();
      
      setProducts(productsData);
      setLowStockAlerts(alerts);
      setStockValue(value);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setLoading(false);
    }
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
        Reports
      </Typography>
      <Grid container spacing={3} style={{ marginBottom: '20px' }}>
        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stock Summary
              </Typography>
              <Typography variant="body1">
                Total Products: {products.length}
              </Typography>
              <Typography variant="body1">
                Total Stock Value: ${stockValue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Low Stock Items
              </Typography>
              <Typography variant="body1">
                Items Below Minimum Level: {lowStockAlerts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {lowStockAlerts.length > 0 && (
        <Card style={{ marginBottom: '20px' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Low Stock Alerts
            </Typography>
            <Alert severity="warning">
              The following items are running low on stock and need attention:
            </Alert>
            <TableContainer component={Paper} style={{ marginTop: '10px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Current Stock</TableCell>
                    <TableCell>Minimum Level</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStockAlerts.map((alert, index) => (
                    <TableRow key={index}>
                      <TableCell>{alert.productName}</TableCell>
                      <TableCell>{alert.currentStock}</TableCell>
                      <TableCell>{alert.minStockLevel}</TableCell>
                      <TableCell>
                        <Chip label="Low Stock" color="secondary" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Products
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price ($)</TableCell>
                  <TableCell>Unit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.pricePerUnit ? product.pricePerUnit.toFixed(2) : '0.00'}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;