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
  Snackbar,
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SupplierService from '../services/supplierService';
import { Supplier } from '../types';

const Suppliers = () => {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    name: '',
    contactInfo: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await SupplierService.getSuppliers();
      setSuppliers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setLoading(false);
    }
  };

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contactInfo: supplier.contactInfo,
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contactInfo: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSupplier(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingSupplier) {
        // Update existing supplier
        await SupplierService.updateSupplier(editingSupplier.id, formData);
        setSnackbar({ open: true, message: 'Supplier updated successfully!', severity: 'success' });
      } else {
        // Add new supplier
        await SupplierService.addSupplier(formData);
        setSnackbar({ open: true, message: 'Supplier added successfully!', severity: 'success' });
      }
      
      handleCloseDialog();
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      setSnackbar({ open: true, message: 'Error saving supplier', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      setSnackbar({ open: true, message: 'Invalid supplier ID', severity: 'error' });
      return;
    }
    
    try {
      console.log('Deleting supplier with ID:', id);
      await SupplierService.deleteSupplier(id);
      setSnackbar({ open: true, message: 'Supplier deleted successfully!', severity: 'success' });
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      let errorMsg = 'Error deleting supplier';
      if (error instanceof Error) {
        errorMsg += `: ${error.message}`;
      }
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
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
          Suppliers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Supplier
        </Button>
      </div>
      
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Supplier Name</TableCell>
                  <TableCell>Contact Info</TableCell>
                  <TableCell>Performance Score</TableCell>
                  <TableCell>Delivery Time (Avg)</TableCell>
                  <TableCell>Quality Rating (Avg)</TableCell>
                  <TableCell>Reliability</TableCell>
                  <TableCell>Total Deliveries</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.contactInfo}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${supplier.performanceScore.toFixed(1)}%`} 
                        color={getPerformanceColor(supplier.performanceScore)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{supplier.deliverySpeedAvg.toFixed(1)} days</TableCell>
                    <TableCell>{supplier.qualityRatingAvg.toFixed(1)}/5</TableCell>
                    <TableCell>{supplier.reliabilityScore.toFixed(1)}%</TableCell>
                    <TableCell>{supplier.totalDeliveries}</TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenDialog(supplier)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="secondary" 
                        onClick={() => handleDelete(supplier.id)}
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
          {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Supplier Name"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            style={{ marginTop: '10px' }}
          />
          <TextField
            margin="dense"
            name="contactInfo"
            label="Contact Information"
            fullWidth
            value={formData.contactInfo}
            onChange={handleInputChange}
            style={{ marginTop: '10px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSupplier ? 'Update' : 'Add'}
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

export default Suppliers;