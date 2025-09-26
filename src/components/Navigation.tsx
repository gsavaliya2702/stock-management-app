import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';

const Navigation = () => {
  return (
    <AppBar position="static" sx={{ marginBottom: 2 }}>
      <Toolbar>
        <LocalGroceryStoreIcon sx={{ marginRight: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Fruit & Veg Stock Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
          <Button 
            color="inherit" 
            component={Link} 
            to="/"
          >
            Dashboard
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/products"
          >
            Products
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/stock"
          >
            Stock
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/sales"
          >
            Sales
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/purchases"
          >
            Purchases
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/suppliers"
          >
            Suppliers
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/discounts"
          >
            Discounts
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/reports"
          >
            Reports
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/payment"
          >
            Payment
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;