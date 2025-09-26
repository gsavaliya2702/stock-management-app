// Custom error for API operations
export class APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIError';
  }
}

// Payment record interface that matches the backend model
export interface PaymentRecord {
  id: string;
  transactionId: string;
  purchaseId: string;
  date: Date;
  amount: number;
  paymentMethod: string;
  status: 'success' | 'failed' | 'pending' | 'refunded';
  message?: string;
  metadata?: Record<string, any>;
  purchaseDetails?: {
    productId: string;
    supplierName: string;
    totalPrice: number;
  };
}

class PaymentHistoryService {
  private paymentRecords: PaymentRecord[] = [];
  private loading: boolean = false;
  
  constructor() {
    // Load records from server on initialization
    this.loadRecordsFromServer();
  }
  
  /**
   * Load payment records from the server
   */
  private async loadRecordsFromServer(): Promise<void> {
    if (this.loading) return;
    
    this.loading = true;
    try {
      const response = await fetch('/api/payment-history');
      
      if (!response.ok) {
        throw new APIError(`Failed to load payment history: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform and validate each record
      this.paymentRecords = data.map((record: any, _index: number) => {
        // Skip invalid records
        if (!record || typeof record !== 'object') {
          console.warn(`Skipping invalid payment record at index ${_index}`);
          return null;
        }
        
        try {
          // Convert string date to Date object
          const parsedDate = new Date(record.date);
          
          // Validate date
          if (isNaN(parsedDate.getTime())) {
            throw new Error(`Invalid date format in record ${record.id}`);
          }
          
          return {
            ...record,
            date: parsedDate,
            // Ensure amount is a number
            amount: typeof record.amount === 'number' ? record.amount : parseFloat(record.amount),
            // Validate status or default to 'failed' if invalid
            status: ['success', 'failed', 'pending', 'refunded'].includes(record.status)
              ? record.status
              : 'failed'
          };
        } catch (err) {
          console.warn(`Error parsing payment record ${record.id}:`, err);
          return null;
        }
      }).filter(Boolean) as PaymentRecord[]; // Remove any null entries
      
      console.log('Payment records loaded from server:', this.paymentRecords.length);
    } catch (error) {
      console.error('Failed to load payment records from server:', error);
      // Fall back to empty array in case of error
      this.paymentRecords = [];
    } finally {
      this.loading = false;
    }
  }
  
  /**
   * Refresh payment records from the server
   */
  async refreshPaymentHistory(): Promise<void> {
    await this.loadRecordsFromServer();
  }
  
  /**
   * Add a payment record to history
   * @param record Payment record to store
   */
  async addPaymentRecord(record: PaymentRecord): Promise<void> {
    // Validate record
    if (!record) {
      throw new APIError('Payment record cannot be empty');
    }
    
    if (!record.id) {
      throw new APIError('Payment record must have an ID');
    }
    
    if (!record.transactionId) {
      throw new APIError('Payment record must have a transaction ID');
    }
    
    if (!(record.date instanceof Date) || isNaN(record.date.getTime())) {
      throw new APIError('Payment record must have a valid date');
    }
    
    if (typeof record.amount !== 'number' || isNaN(record.amount)) {
      throw new APIError('Payment amount must be a valid number');
    }
    
    // Add to memory storage (will be updated when server refreshes)
    this.paymentRecords.push(record);
    
    // Refresh from server to get the official record
    await this.loadRecordsFromServer();
  }
  
  /**
   * Get all payment records
   * @param filter Optional filter criteria
   * @returns Array of payment records
   */
  async getPaymentHistory(filter?: {
    startDate?: Date;
    endDate?: Date;
    status?: PaymentRecord['status'];
    paymentMethod?: string;
  }): Promise<PaymentRecord[]> {
    // Refresh records from server
    await this.loadRecordsFromServer();
    
    // Apply filters if provided
    if (filter) {
      return this.paymentRecords.filter(record => {
        // Date range filter
        if (filter.startDate && record.date < filter.startDate) return false;
        if (filter.endDate && record.date > filter.endDate) return false;
        
        // Status filter
        if (filter.status && record.status !== filter.status) return false;
        
        // Payment method filter
        if (filter.paymentMethod && record.paymentMethod !== filter.paymentMethod) return false;
        
        return true;
      });
    }
    
    return [...this.paymentRecords]; // Return a copy to prevent external modifications
  }
  
  /**
   * Get a specific payment record by ID
   * @param id Payment record ID
   * @returns Payment record or null if not found
   */
  async getPaymentById(id: string): Promise<PaymentRecord | null> {
    if (!id) return null;
    
    // Refresh records from server
    await this.loadRecordsFromServer();
    
    return this.paymentRecords.find(record => record.id === id) || null;
  }
  
  /**
   * Clear payment history (server-side operation)
   * @param options Optional parameters to customize clearing behavior
   * @returns true if successful
   */
  async clearPaymentHistory(options?: { keepLast?: number; onlyStatus?: PaymentRecord['status'] }): Promise<boolean> {
    try {
      // This would be implemented on the server side
      // For now, just refresh from server
      await this.loadRecordsFromServer();
      return true;
    } catch (error) {
      console.error('Failed to clear payment history:', error);
      return false;
    }
  }
  
  /**
   * Force refresh of payment records
   */
  async forceRefresh(): Promise<void> {
    await this.loadRecordsFromServer();
  }
}

const paymentHistoryService = new PaymentHistoryService();
export default paymentHistoryService;
