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
  Chip,
  Alert,
  Box
} from '@mui/material';
import StockService from '../services/stockService';
import { Product } from '../types';

const DiscountCampaigns = () => {
  const [loading, setLoading] = useState(true);
  const [nearExpiryProducts, setNearExpiryProducts] = useState<any[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNearExpiryProducts();
  }, []);

  const fetchNearExpiryProducts = async () => {
    try {
      const data = await StockService.getNearExpiryProducts();
      setNearExpiryProducts(data);

      // Fetch stock items and map productId -> quantity for current stock
      const stockItems = await StockService.getStockItems();
      const map: Record<string, number> = {};
      stockItems.forEach((item: any) => {
        if (item && item.productId) {
          map[item.productId] = item.quantity ?? 0;
        }
      });
      setStockMap(map);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching near expiry products:', error);
      setError('Failed to load near expiry products');
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate: Date) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDiscountLevel = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 1) return 'High (30%)';
    if (daysUntilExpiry <= 2) return 'Medium (20%)';
    return 'Low (10%)';
  };

  const getDiscountColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 1) return 'error';
    if (daysUntilExpiry <= 2) return 'warning';
    return 'info';
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
        Discount Campaigns
      </Typography>
      
      <Alert severity="info" style={{ marginBottom: '20px' }}>
        <Typography variant="body1">
          This page shows products that are nearing their expiry date. 
          Automatic discounts are applied based on how close the product is to expiring:
        </Typography>
        <ul>
          <li>1 day or less: 30% discount</li>
          <li>2 days: 20% discount</li>
          <li>3 days: 10% discount</li>
        </ul>
      </Alert>
      
      {error && (
        <Alert severity="error" style={{ marginBottom: '20px' }}>
          {error}
        </Alert>
      )}
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Products Nearing Expiry
          </Typography>
          
          {nearExpiryProducts.length === 0 ? (
            <Typography color="textSecondary">
              No products are currently nearing expiry.
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Current Stock</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Days Remaining</TableCell>
                    <TableCell>Discount Level</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {nearExpiryProducts.map((product) => {
                    const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate);
                    return (
                      <TableRow key={product._id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.categoryId?.category_name || product.category || 'Unknown'}</TableCell>
                        <TableCell>{stockMap[product._id] ?? product.stockQuantity ?? 0}</TableCell>
                        <TableCell>{new Date(product.expiryDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`} 
                            color={getDiscountColor(daysUntilExpiry)} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getDiscountLevel(daysUntilExpiry)} 
                            color={getDiscountColor(daysUntilExpiry)} 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      
      <Box mt={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              How Discount Campaigns Work
            </Typography>
            <Typography variant="body2" paragraph>
              When a customer purchases a product that is nearing expiry, the system automatically applies 
              a discount based on how close the product is to expiring. This helps reduce waste by 
              encouraging the sale of products before they expire.
            </Typography>
            <Typography variant="body2" paragraph>
              The discount is calculated at the time of sale and is applied automatically. 
              No manual intervention is required from staff.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
};

export default DiscountCampaigns;