import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Snackbar,
  Alert,
  Box,
  Grid,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentService from '../services/paymentService';
import PaymentHistoryService from '../services/paymentHistoryService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Payment = () => {
  const [tabValue, setTabValue] = useState(0);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    amount: '' as string | number,
    paymentMethod: 'card'
  });
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ 
    success: boolean; 
    transactionId?: string; 
    message?: string;
    amount?: number;
    paymentMethod?: string;
    receipt?: string;
  } | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Load payment history on component mount
  useEffect(() => {
    const loadPaymentHistory = async () => {
      try {
        const history = await PaymentHistoryService.getPaymentHistory();
        setPaymentHistory(history);
      } catch (error) {
        console.error('Failed to load payment history:', error);
      }
    };
    
    loadPaymentHistory();
  }, []);

  const handleTabChange = async (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1) {
      // Refresh payment history when switching to history tab
      try {
        const history = await PaymentHistoryService.getPaymentHistory();
        setPaymentHistory(history);
      } catch (error) {
        console.error('Failed to refresh payment history:', error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear validation errors when user types
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const cleaned = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
      setPaymentData({
        ...paymentData,
        [name]: formatted
      });
    }
    // Format expiry date with slash
    else if (name === 'expiryDate') {
      let formatted = value.replace(/[^0-9]/g, '');
      if (formatted.length > 2) {
        formatted = formatted.slice(0, 2) + '/' + formatted.slice(2, 4);
      }
      setPaymentData({
        ...paymentData,
        [name]: formatted
      });
    } else if (name === 'amount') {
      // Allow empty input field for better UX, but parse to number when valid
      const displayValue = value === '' ? '' : value;
      setPaymentData({
        ...paymentData,
        [name]: displayValue
      });
    } else {
      setPaymentData({
        ...paymentData,
        [name]: value,
      });
    }
  };
  
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setPaymentData({
      ...paymentData,
      [name]: value,
    });
    
    // Clear card details if cash payment is selected
    if (name === 'paymentMethod' && value === 'cash') {
      setPaymentData({
        ...paymentData,
        [name]: value,
        cardNumber: '',
        expiryDate: '',
        cvv: ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors({});
    
    // Skip card validation for cash payments
    if (paymentData.paymentMethod === 'card') {
      // Use enhanced validation
      const validationResult = PaymentService.validatePaymentDetails(
        paymentData.cardNumber, 
        paymentData.expiryDate, 
        paymentData.cvv
      );
      
      if (!validationResult.isValid) {
        setSnackbar({ 
          open: true, 
          message: validationResult.message || 'Please check your payment details', 
          severity: 'error' 
        });
        return;
      }
    }
    
    // Check if amount is empty or not a positive number
    const amountValue = typeof paymentData.amount === 'string' 
      ? parseFloat(paymentData.amount) 
      : paymentData.amount;
    
    if (isNaN(amountValue) || amountValue <= 0) {
      setSnackbar({ 
        open: true, 
        message: 'Please enter a valid amount greater than 0', 
        severity: 'error' 
      });
      return;
    }
    
    setProcessing(true);
    
    try {
      // Ensure amount is a number before processing
      const numericAmount = typeof paymentData.amount === 'string' 
        ? parseFloat(paymentData.amount) 
        : paymentData.amount;
      
      // Extra validation to catch edge cases
      if (isNaN(numericAmount)) {
        throw new Error('Invalid amount format');
      }
      
      // Log operation start for debugging purposes
      console.log(`Processing ${paymentData.paymentMethod} payment for $${numericAmount}`);
      
      const result = await PaymentService.processPayment(
        numericAmount, 
        paymentData.paymentMethod
      ).catch(err => {
        // Add context to error before propagating it
        console.error('Payment processing error:', err);
        throw new Error(`Payment service error: ${err.message || 'Unknown error'}`);
      });
      
      // Verify the result contains expected data
      if (!result || !result.transactionId) {
        throw new Error('Payment service returned invalid response');
      }
      
      // Generate receipt
      const receiptData = {
        transactionId: result.transactionId,
        amount: numericAmount,
        paymentMethod: paymentData.paymentMethod,
        success: result.success,
        date: new Date()
      };
      
      let receipt;
      try {
        receipt = PaymentService.generateReceipt(receiptData);
      } catch (receiptError: any) {
        console.warn('Receipt generation failed:', receiptError);
        // Continue execution but note the receipt error
        receipt = `Receipt generation failed: ${receiptError.message}`;
      }
      
      // Save to payment history with error handling
      try {
        PaymentHistoryService.addPaymentRecord({
          id: result.transactionId,
          transactionId: result.transactionId,
          purchaseId: '', // For direct payments, this might be empty
          date: new Date(),
          amount: numericAmount,
          status: result.success ? 'success' : 'failed',
          paymentMethod: paymentData.paymentMethod,
          message: result.message
        });
      } catch (historyError) {
        // Non-critical error, log it but continue execution
        console.error('Failed to save payment history:', historyError);
        // Alert user but don't stop the flow
        setSnackbar({ 
          open: true, 
          message: 'Payment processed but history recording failed', 
          severity: 'warning' 
        });
      }
      
      setPaymentResult({ 
        success: result.success, 
        transactionId: result.transactionId,
        message: result.message,
        amount: numericAmount,
        paymentMethod: paymentData.paymentMethod,
        receipt
      });
      
      setSnackbar({ 
        open: true, 
        message: result.success ? 'Payment successful!' : result.message || 'Payment failed', 
        severity: result.success ? 'success' : 'error' 
      });
    } catch (error: any) {
      console.error('Payment submission error:', error);
      
      // Create user-friendly error message
      const errorMessage = error.message && !error.message.includes('Error:') 
        ? `Error: ${error.message}`
        : error.message || 'An unexpected error occurred during payment processing';
      
      setPaymentResult({ 
        success: false, 
        message: errorMessage
      });
      
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  const handleDownloadReceipt = () => {
    if (!paymentResult || !paymentResult.receipt) {
      setSnackbar({
        open: true,
        message: 'Receipt is not available',
        severity: 'error'
      });
      return;
    }

    try {
      if (!paymentResult.transactionId) {
        throw new Error('Missing transaction ID for receipt');
      }
      
      PaymentService.downloadReceipt(
        paymentResult.receipt, 
        `receipt_${paymentResult.transactionId}.txt`
      );
      
      setSnackbar({
        open: true,
        message: 'Receipt downloaded successfully',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Receipt download failed:', error);
      
      setSnackbar({
        open: true,
        message: `Failed to download receipt: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Payment Processing
      </Typography>
      
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="payment tabs">
            <Tab label="Process Payment" />
            <Tab label="Payment History" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Process Payment
              </Typography>
              
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Amount ($)"
                    name="amount"
                    type="number"
                    value={paymentData.amount}
                    onChange={handleInputChange}
                    required
                    error={!!validationErrors.amount}
                    helperText={validationErrors.amount}
                  />
                  
                  <FormControl fullWidth>
                    <InputLabel id="payment-method-label">Payment Method</InputLabel>
                    <Select
                      labelId="payment-method-label"
                      name="paymentMethod"
                      value={paymentData.paymentMethod}
                      onChange={handleSelectChange}
                      label="Payment Method"
                    >
                      <MenuItem value="card">Credit/Debit Card</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {paymentData.paymentMethod === 'card' && (
                    <>
                      <TextField
                        fullWidth
                        label="Card Number"
                        name="cardNumber"
                        value={paymentData.cardNumber}
                        onChange={handleInputChange}
                        placeholder="1234 5678 9012 3456"
                        required
                        error={!!validationErrors.cardNumber}
                        helperText={validationErrors.cardNumber}
                      />
                      
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          fullWidth
                          label="Expiry Date"
                          name="expiryDate"
                          value={paymentData.expiryDate}
                          onChange={handleInputChange}
                          placeholder="MM/YY"
                          required
                          error={!!validationErrors.expiryDate}
                          helperText={validationErrors.expiryDate}
                        />
                        
                        <TextField
                          fullWidth
                          label="CVV"
                          name="cvv"
                          value={paymentData.cvv}
                          onChange={handleInputChange}
                          placeholder="123"
                          required
                          error={!!validationErrors.cvv}
                          helperText={validationErrors.cvv}
                        />
                      </Box>
                    </>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, marginTop: 1 }}>
                    <Button 
                      variant="outlined" 
                      onClick={() => {
                        // Reset form
                        setPaymentData({
                          cardNumber: '',
                          expiryDate: '',
                          cvv: '',
                          amount: '' as string | number,
                          paymentMethod: 'card'
                        });
                        setPaymentResult(null);
                        setValidationErrors({});
                      }}
                    >
                      Reset
                    </Button>
                    <Button 
                      variant="contained" 
                      type="submit"
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                          Processing...
                        </>
                      ) : 'Pay Now'}
                    </Button>
                  </Box>
                </Box>
              </form>
            </CardContent>
          </Card>
          
          {paymentResult && (
            <Card style={{ marginTop: '20px' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Result
                </Typography>
                
                {paymentResult.success ? (
                  <>
                    <Alert 
                      severity="success"
                      action={
                        <IconButton
                          color="inherit"
                          size="small"
                          onClick={handleDownloadReceipt}
                        >
                          <ReceiptIcon />
                        </IconButton>
                      }
                    >
                      <Typography variant="body1">
                        Payment successful! Transaction ID: {paymentResult.transactionId}
                      </Typography>
                    </Alert>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<ReceiptIcon />}
                        onClick={handleDownloadReceipt}
                      >
                        Download Receipt
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Alert severity="error">
                    <Typography variant="body1">
                      Payment failed: {paymentResult.message}
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment History
              </Typography>
              
              {paymentHistory.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table aria-label="payment history table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Transaction ID</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentHistory.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{new Date(payment.date).toLocaleString()}</TableCell>
                          <TableCell>{payment.id}</TableCell>
                          <TableCell>${payment.amount.toFixed(2)}</TableCell>
                          <TableCell>{payment.paymentMethod}</TableCell>
                          <TableCell>
                            <Alert severity={payment.status === 'success' ? 'success' : 'error'} 
                                  icon={false} 
                                  sx={{ py: 0 }}>
                              {payment.status === 'success' ? 'Success' : 'Failed'}
                            </Alert>
                          </TableCell>
                          <TableCell>{payment.message || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1">No payment history available.</Typography>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Box>
      
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

export default Payment;