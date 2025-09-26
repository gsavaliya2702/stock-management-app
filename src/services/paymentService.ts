// Custom error classes for better error handling
export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

class PaymentService {
  // Improved payment processing simulation with enhanced error handling
  async processPayment(amount: number, paymentMethod: string): Promise<{ 
    success: boolean; 
    transactionId: string; 
    message?: string 
  }> {
    try {
      // Input validation with specific error types
      if (typeof amount !== 'number') {
        throw new ValidationError('Payment amount must be a number');
      }
      
      if (amount <= 0) {
        throw new ValidationError('Payment amount must be greater than 0');
      }
      
      if (!paymentMethod || typeof paymentMethod !== 'string') {
        throw new ValidationError('Payment method is required');
      }
      
      // Simulate network connectivity issues (1% chance)
      if (Math.random() < 0.01) {
        throw new NetworkError('Payment gateway connection failed. Please try again.');
      }
      
      // Simulate API delay (1-3 seconds)
      const delay = Math.floor(Math.random() * 2000) + 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Business rule validation
      if (amount > 10000) {
        console.log(`Large transaction rejected: $${amount} exceeds limit`);
        return { 
          success: false, 
          transactionId: `rejected_${Date.now()}`,
          message: 'Transaction amount exceeds maximum limit of $10,000'
        };
      }
      
      // Simulate different payment methods
      if (paymentMethod === 'cash') {
        // Cash payments always succeed
        console.log(`Cash payment processed: $${amount}`);
        return { 
          success: true, 
          transactionId: `cash_${Date.now()}`,
          message: 'Cash payment recorded successfully'
        };
      }
      
      // For card payments, simulate card issuer responses
      const success = Math.random() > 0.15; // 85% success rate
      const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      if (success) {
        console.log(`Card payment successful: $${amount}, ID: ${transactionId}`);
        return { success: true, transactionId, message: 'Payment processed successfully' };
      } else {
        // Different failure scenarios for better testing
        const failureReasons = [
          'Insufficient funds',
          'Card declined',
          'Expired card',
          'Invalid card number',
          'Security verification failed'
        ];
        const randomReason = failureReasons[Math.floor(Math.random() * failureReasons.length)];
        console.warn(`Payment failed: ${randomReason} for amount $${amount}`);
        
        return { 
          success: false, 
          transactionId,
          message: `Payment failed: ${randomReason}`
        };
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      
      // Handle specific error types
      if (error instanceof ValidationError) {
        throw error; // Let validation errors bubble up
      } else if (error instanceof NetworkError) {
        // Log network errors for monitoring but provide a user-friendly message
        console.error('Network connectivity issue:', error);
        return {
          success: false,
          transactionId: `error_${Date.now()}`,
          message: 'Unable to connect to payment service. Please check your internet connection and try again.'
        };
      } else {
        // For unexpected errors, provide a generic message but log details
        console.error('Unexpected payment error:', error);
        return {
          success: false,
          transactionId: `error_${Date.now()}`,
          message: 'An unexpected error occurred while processing your payment. Please try again later.'
        };
      }
    }
  }
  
  // Enhanced validation with robust error handling
  validatePaymentDetails(cardNumber: string, expiryDate: string, cvv: string): { 
    isValid: boolean; 
    message?: string;
    field?: string; // Identifies which field failed validation
    severity?: 'error' | 'warning'; // Indicates severity of the validation issue
  } {
    try {
      // Input existence validation
      if (!cardNumber) {
        return { 
          isValid: false, 
          message: 'Card number is required', 
          field: 'cardNumber',
          severity: 'error'
        };
      }
      
      if (!expiryDate) {
        return { 
          isValid: false, 
          message: 'Expiry date is required', 
          field: 'expiryDate',
          severity: 'error' 
        };
      }
      
      if (!cvv) {
        return { 
          isValid: false, 
          message: 'Security code (CVV) is required', 
          field: 'cvv',
          severity: 'error' 
        };
      }
      
      // Card number basic validation
      const cleanCardNumber = cardNumber.replace(/\s/g, '');
      if (!/^\d+$/.test(cleanCardNumber)) {
        return { 
          isValid: false, 
          message: 'Card number should contain only digits', 
          field: 'cardNumber',
          severity: 'error' 
        };
      }
      
      if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
        return { 
          isValid: false, 
          message: 'Card number must be between 13 and 19 digits', 
          field: 'cardNumber',
          severity: 'error' 
        };
      }
      
      // Detect card type for additional validation
      let cardType = 'unknown';
      if (/^4/.test(cleanCardNumber)) {
        cardType = 'visa';
      } else if (/^5[1-5]/.test(cleanCardNumber)) {
        cardType = 'mastercard';
      } else if (/^3[47]/.test(cleanCardNumber)) {
        cardType = 'amex';
      } else if (/^6(?:011|5)/.test(cleanCardNumber)) {
        cardType = 'discover';
      }
      
      // Additional validation for known card types
      if (cardType === 'amex' && cleanCardNumber.length !== 15) {
        return { 
          isValid: false, 
          message: 'American Express cards must have exactly 15 digits', 
          field: 'cardNumber',
          severity: 'error' 
        };
      }
      
      if ((cardType === 'visa' || cardType === 'mastercard' || cardType === 'discover') && 
          cleanCardNumber.length !== 16) {
        return { 
          isValid: false, 
          message: `${cardType.charAt(0).toUpperCase() + cardType.slice(1)} cards must have exactly 16 digits`, 
          field: 'cardNumber',
          severity: 'error' 
        };
      }
      
      // Simple Luhn algorithm check (credit card validation)
      let sum = 0;
      let isEven = false;
      try {
        for (let i = cleanCardNumber.length - 1; i >= 0; i--) {
          let digit = parseInt(cleanCardNumber.charAt(i), 10);
          
          if (isEven) {
            digit *= 2;
            if (digit > 9) {
              digit -= 9;
            }
          }
          
          sum += digit;
          isEven = !isEven;
        }
        
        if (sum % 10 !== 0) {
          return { 
            isValid: false, 
            message: 'Invalid card number (failed checksum validation)', 
            field: 'cardNumber',
            severity: 'error' 
          };
        }
      } catch (error) {
        console.error('Error in Luhn algorithm calculation:', error);
        return { 
          isValid: false, 
          message: 'Invalid card number format', 
          field: 'cardNumber',
          severity: 'error' 
        };
      }
      
      // Expiry date validation
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(expiryDate)) {
        return { 
          isValid: false, 
          message: 'Expiry date must be in MM/YY format', 
          field: 'expiryDate',
          severity: 'error' 
        };
      }
      
      try {
        const [month, year] = expiryDate.split('/').map(Number);
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;
        
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          return { 
            isValid: false, 
            message: 'Card has expired', 
            field: 'expiryDate',
            severity: 'error' 
          };
        }
        
        // Warning for cards expiring soon (within 1 month)
        if (year === currentYear && month === currentMonth) {
          return { 
            isValid: true, // Still valid but with warning
            message: 'Your card expires this month', 
            field: 'expiryDate',
            severity: 'warning' 
          };
        }
      } catch (error) {
        console.error('Error parsing expiry date:', error);
        return { 
          isValid: false, 
          message: 'Invalid expiry date format', 
          field: 'expiryDate',
          severity: 'error' 
        };
      }
      
      // CVV validation with card-specific rules
      try {
        if (!/^\d+$/.test(cvv)) {
          return { 
            isValid: false, 
            message: 'CVV must contain only digits', 
            field: 'cvv',
            severity: 'error' 
          };
        }
        
        // Different CVV length rules based on card type
        if (cardType === 'amex' && cvv.length !== 4) {
          return { 
            isValid: false, 
            message: 'American Express cards require a 4-digit security code', 
            field: 'cvv',
            severity: 'error' 
          };
        } else if (cardType !== 'amex' && cvv.length !== 3) {
          return { 
            isValid: false, 
            message: 'Security code (CVV) must be 3 digits', 
            field: 'cvv',
            severity: 'error' 
          };
        }
      } catch (error) {
        console.error('Error validating CVV:', error);
        return { 
          isValid: false, 
          message: 'Invalid security code format', 
          field: 'cvv',
          severity: 'error' 
        };
      }
      
      // All validations passed
      return { 
        isValid: true,
        message: `${cardType !== 'unknown' ? cardType.charAt(0).toUpperCase() + cardType.slice(1) : 'Card'} validated successfully`
      };
    } catch (error) {
      // Catch any unexpected errors in the validation process
      console.error('Unexpected error during payment validation:', error);
      return { 
        isValid: false, 
        message: 'An error occurred while validating payment details', 
        severity: 'error' 
      };
    }
  }
  
  /**
   * Generate a receipt for a transaction
   * @param paymentData Payment transaction data
   * @returns Formatted receipt string
   */
  generateReceipt(paymentData: any): string {
    try {
      // Validate the input data
      if (!paymentData) {
        throw new ValidationError('Payment data is required to generate a receipt');
      }
      
      if (!paymentData.transactionId) {
        throw new ValidationError('Transaction ID is required for receipt generation');
      }
      
      if (typeof paymentData.amount !== 'number') {
        throw new ValidationError('Valid payment amount is required for receipt generation');
      }
      
      // Format the amount with proper currency formatting
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(paymentData.amount);
      
      // Get formatted date and time
      const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium'
      });
      const formattedDateTime = dateTimeFormatter.format(new Date());
      
      // Generate receipt with additional information
      return `
      PAYMENT RECEIPT
      ================
      Transaction ID: ${paymentData.transactionId}
      Date: ${formattedDateTime}
      Amount: ${formattedAmount}
      Payment Method: ${paymentData.paymentMethod || 'Unknown'}
      Status: ${paymentData.success ? 'SUCCESS' : 'FAILED'}
      ${paymentData.message ? `Message: ${paymentData.message}` : ''}
      ${paymentData.purchaseId ? `Purchase ID: ${paymentData.purchaseId}` : ''}
      
      Thank you for your business!
      `;
    } catch (error) {
      console.error('Error generating receipt:', error);
      
      // Return a basic receipt with an error note if there was a problem
      if (error instanceof ValidationError) {
        return `
        PAYMENT RECEIPT (ERROR)
        =======================
        Error: ${error.message}
        Date: ${new Date().toLocaleString()}
        
        Please contact support for assistance.
        `;
      }
      
      // For unexpected errors
      return `
      PAYMENT RECEIPT (ERROR)
      =======================
      Error: Unable to generate complete receipt
      Date: ${new Date().toLocaleString()}
      ${paymentData?.transactionId ? `Transaction ID: ${paymentData.transactionId}` : ''}
      
      Please contact support with this transaction ID for assistance.
      `;
    }
  }
  
  /**
   * Download receipt as a text file with error handling
   * @param receipt Receipt content as string
   * @param fileName Optional custom filename
   * @returns boolean indicating success
   */
  downloadReceipt(receipt: string, fileName: string = `receipt_${Date.now()}.txt`): boolean {
    if (!receipt || typeof receipt !== 'string') {
      console.error('Invalid receipt content provided');
      return false;
    }
    
    try {
      const blob = new Blob([receipt], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      
      // Append to document, click, and remove (for browser compatibility)
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the URL object
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Failed to download receipt:', error);
      
      // Try a fallback method for some browsers
      try {
        // Create text link with receipt
        const fallbackLink = document.createElement('a');
        fallbackLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(receipt));
        fallbackLink.setAttribute('download', fileName);
        
        fallbackLink.style.display = 'none';
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        document.body.removeChild(fallbackLink);
        
        return true;
      } catch (fallbackError) {
        console.error('Receipt download fallback also failed:', fallbackError);
        return false;
      }
    }
  }
  
  /**
   * Print receipt directly to the printer
   * @param receipt Receipt content
   * @returns boolean indicating success
   */
  printReceipt(receipt: string): boolean {
    if (!receipt) {
      console.error('Cannot print empty receipt');
      return false;
    }
    
    try {
      // Create a hidden iframe for printing
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = 'none';
      
      document.body.appendChild(printIframe);
      
      // Write the receipt to the iframe document
      const printDocument = printIframe.contentWindow?.document;
      if (!printDocument) {
        throw new Error('Could not access print document');
      }
      
      printDocument.open();
      printDocument.write(`
        <html>
          <head>
            <title>Payment Receipt</title>
            <style>
              body { 
                font-family: monospace; 
                white-space: pre;
                padding: 20px;
                line-height: 1.5;
              }
            </style>
          </head>
          <body>${receipt.replace(/\n/g, '<br>')}</body>
        </html>
      `);
      printDocument.close();
      
      // Print the iframe content
      printIframe.contentWindow?.focus();
      printIframe.contentWindow?.print();
      
      // Remove the iframe after printing (with delay to ensure print dialog appears)
      setTimeout(() => {
        document.body.removeChild(printIframe);
      }, 500);
      
      return true;
    } catch (error) {
      console.error('Failed to print receipt:', error);
      return false;
    }
  }
}

// Create a single instance of the service
const paymentService = new PaymentService();
export default paymentService;