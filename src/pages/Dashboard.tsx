import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StockService from '../services/stockService';
import { StockAlert } from '../types';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [stockValue, setStockValue] = useState(0);
  const [lowStockAlerts, setLowStockAlerts] = useState<StockAlert[]>([]);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const products = await StockService.getProducts();
        const value = await StockService.getStockValue();
        const alerts = await StockService.getLowStockAlerts();
        const sales = await StockService.getTotalSales();
        
        setProductCount(products.length);
        setStockValue(value);
        setLowStockAlerts(alerts);
        setTotalSales(sales);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        Dashboard
      </Typography>
      <Grid container spacing={3} style={{ marginBottom: '20px' }}>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card>
            <CardContent>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <LocalGroceryStoreIcon fontSize="large" color="primary" />
                <div style={{ marginLeft: '15px' }}>
                  <Typography color="textSecondary" gutterBottom>
                    Total Products
                  </Typography>
                  <Typography variant="h5">
                    {productCount}
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card>
            <CardContent>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon fontSize="large" color="primary" />
                <div style={{ marginLeft: '15px' }}>
                  <Typography color="textSecondary" gutterBottom>
                    Stock Value
                  </Typography>
                  <Typography variant="h5">
                    ${stockValue.toFixed(2)}
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card>
            <CardContent>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCartIcon fontSize="large" color="primary" />
                <div style={{ marginLeft: '15px' }}>
                  <Typography color="textSecondary" gutterBottom>
                    Total Sales
                  </Typography>
                  <Typography variant="h5">
                    ${totalSales.toFixed(2)}
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card>
            <CardContent>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon fontSize="large" color="secondary" />
                <div style={{ marginLeft: '15px' }}>
                  <Typography color="textSecondary" gutterBottom>
                    Low Stock Items
                  </Typography>
                  <Typography variant="h5">
                    {lowStockAlerts.length}
                  </Typography>
                </div>
              </div>
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
              The following items are running low on stock:
            </Alert>
            <List>
              {lowStockAlerts.map((alert, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <WarningIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={alert.productName} 
                    secondary={`Current: ${alert.currentStock} ${alert.currentStock <= 1 ? 'unit' : 'units'} (Minimum: ${alert.minStockLevel})`} 
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Typography color="textSecondary">
            No recent activity to display.
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;