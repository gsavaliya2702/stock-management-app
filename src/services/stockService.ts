import { Product, StockItem, Sale, Purchase, StockAlert } from '../types';
import { 
  ApiError, 
  NotFoundError, 
  ValidationError, 
  NetworkError,
  BusinessError,
  handleApiError
} from './serviceErrors';

// Base API URL
const API_BASE_URL = 'http://localhost:5000/api';

// Default request timeout in milliseconds
const DEFAULT_TIMEOUT = 10000; // 10 seconds

// Helper function to validate URLs
function isValidUrl(url: string): boolean {
  try {
    // Allow relative URLs or a simple path without validation
    if (url.startsWith('/') || !url.includes('://')) {
      return true;
    }
    
    // For absolute URLs, use URL constructor to validate
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

class StockManagementService {
  // Products
  /**
   * Fetch all products with enhanced error handling
   * @returns Promise resolving to array of products
   * @throws ApiError, NetworkError
   */
  async getProducts(): Promise<Product[]> {
    try {
      // Create an AbortController for timeout functionality
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
      
      // Log the request for debugging purposes
      console.log('Fetching products from API');
      
      // Improved fetch with timeout and better error handling
      const response = await fetch(`${API_BASE_URL}/products`, { 
        credentials: 'omit',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      }).finally(() => clearTimeout(timeoutId));
      
      // Handle non-ok responses
      if (!response.ok) {
        return handleApiError(response, 'Failed to fetch products');
      }
      
      // Parse JSON response with error handling
      let products;
      try {
        products = await response.json();
      } catch (error) {
        console.error('Error parsing products response:', error);
        throw new ApiError('Invalid response format when fetching products');
      }
      
      // Validate response format
      if (!Array.isArray(products)) {
        console.error('Unexpected products response format:', products);
        throw new ApiError('Unexpected data format in products response');
      }
      
      console.log(`Successfully fetched ${products.length} products`);
      
      // Convert MongoDB _id to id for frontend compatibility and handle populated category
      return products.map((product: any) => {
        const transformedProduct = {
          ...product,
          id: product._id || product.id, // Use _id if available, fallback to id
          category: product.categoryId?.category_name || '', // Extract category name from populated data
          categoryId: product.categoryId?._id || product.categoryId || '' // Use the actual ID
        };
        
        // Handle populated supplier data if available
        if (product.supplierId && typeof product.supplierId === 'object') {
          transformedProduct.supplierId = product.supplierId._id || product.supplierId;
        }
        
        return transformedProduct;
      });
    } catch (error) {
      // Handle specific error types
      if (error instanceof ValidationError || error instanceof ApiError) {
        // Rethrow known error types
        throw error;
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('Product fetch request timed out');
        throw new NetworkError('Request timed out while fetching products');
      } else if (error instanceof Error) {
        // Handle network errors
        console.error('Error fetching products:', error);
        
        // Check for network-related errors
        if (!navigator.onLine || error.message.includes('NetworkError')) {
          throw new NetworkError('Network connection issue while fetching products');
        }
        
        // Generic fallback error
        throw new ApiError(`Failed to fetch products: ${error.message}`);
      } else {
        // Fallback for unknown error types
        throw new ApiError('Unknown error occurred while fetching products');
      }
    }
  }

  /**
   * Add a new product with enhanced validation and error handling
   * @param product Product data to add
   * @returns Promise resolving to the created product
   * @throws ValidationError, ApiError, NetworkError
   */
  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    // Validate product data before making the request
    this.validateProduct(product);
    
    try {
      // Create an AbortController for timeout functionality
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
      
      console.log('Adding new product:', product.name);
      
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        credentials: 'omit',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(product),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
      
      // Process response text with error handling
      let text;
      try {
        text = await response.text();
      } catch (error) {
        console.error('Error reading response text:', error);
        throw new ApiError('Failed to read server response');
      }
      
      // Try to parse JSON response
      let data: any = null;
      if (text) {
        try { 
          data = JSON.parse(text); 
        } catch (error) { 
          console.error('JSON parse error:', error);
          // Don't throw here, handle non-JSON response later
        }
      }
      
      // Handle non-ok responses with proper error types
      if (!response.ok) {
        if (response.status === 400) {
          // Validation errors from the server
          const fieldErrors = data?.errors || {};
          const fieldName = Object.keys(fieldErrors)[0] || '';
          const errorMessage = data?.message || 
            (fieldName ? `${fieldName}: ${fieldErrors[fieldName]}` : 'Invalid product data');
          
          throw new ValidationError(errorMessage, fieldName);
        } else if (response.status === 409) {
          // Conflict error - typically duplicate product
          throw new ApiError('A product with this name or code already exists', 409);
        } else {
          // Use handleApiError helper for other status codes
          return handleApiError(response, 'Failed to add product');
        }
      }
      
      // Handle empty or invalid responses
      if (!data) {
        console.error('Empty or invalid response when adding product');
        throw new ApiError('Received empty response from server');
      }
      
      console.log('Product added successfully:', data.id || data._id);
      
      // Convert MongoDB _id to id for frontend compatibility if needed
      if (data._id && !data.id) {
        data.id = data._id;
      }
      
      return data;
    } catch (error) {
      // Handle specific error types
      if (error instanceof ValidationError || 
          error instanceof ApiError || 
          error instanceof NetworkError) {
        // Rethrow known error types
        throw error;
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('Add product request timed out');
        throw new NetworkError('Request timed out while adding product');
      } else if (error instanceof Error) {
        console.error('Error adding product:', error);
        
        // Check for network-related errors
        if (!navigator.onLine) {
          throw new NetworkError('Network connection issue while adding product');
        }
        
        // Generic fallback
        throw new ApiError(`Failed to add product: ${error.message}`);
      } else {
        // Fallback for unknown error types
        throw new ApiError('Unknown error occurred while adding product');
      }
    }
  }
  
  /**
   * Validate product data
   * @param product Product data to validate
   * @throws ValidationError if validation fails
   */
  private validateProduct(product: Partial<Product>): void {
    if (!product) {
      throw new ValidationError('Product data is required');
    }
    
    if (!product.name || product.name.trim() === '') {
      throw new ValidationError('Product name is required', 'name');
    }
    
    if (product.name && product.name.length < 2) {
      throw new ValidationError('Product name must be at least 2 characters', 'name');
    }
    
    // Check for categoryId now instead of category
    if (!product.categoryId || product.categoryId.trim() === '') {
      throw new ValidationError('Product category is required', 'categoryId');
    }
    
    if (!product.unit || product.unit.trim() === '') {
      throw new ValidationError('Product unit is required', 'unit');
    }
    
    // Check either price or pricePerUnit
    const price = product.price !== undefined ? product.price : product.pricePerUnit;
    
    if (price === undefined || price === null) {
      throw new ValidationError('Product price is required', 'price');
    }
    
    if (typeof price !== 'number' || isNaN(price) || price < 0) {
      throw new ValidationError('Product price must be a positive number', 'price');
    }
    
    // Check supplierId
    if (!product.supplierId) {
      throw new ValidationError('Supplier is required', 'supplierId');
    }
    
    // Make sure stockQuantity is set - this is required by MongoDB schema
    if (product.stockQuantity === undefined || product.stockQuantity === null) {
      // Auto-fix: we'll add a default value rather than throwing an error
      product.stockQuantity = 0;
    }
    
    // Optional field validations
    // Validate date fields if present
    if (product.expiryDate !== undefined) {
      try {
        const date = new Date(product.expiryDate);
        if (isNaN(date.getTime())) {
          throw new ValidationError('Invalid expiry date format', 'expiryDate');
        }
      } catch (e) {
        throw new ValidationError('Invalid expiry date', 'expiryDate');
      }
    }
    
    // Supplier ID validation if present
    if (product.supplierId !== undefined && product.supplierId.trim() === '') {
      throw new ValidationError('Supplier ID cannot be empty if provided', 'supplierId');
    }
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    const text = await response.text();
    let data: any;
    if (text) {
      try { data = JSON.parse(text); } catch { /* ignore */ }
    }
    if (!response.ok) {
      const message = data?.message || response.statusText || 'Failed to update product';
      throw new Error(message);
    }
    return data;
  }

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      credentials: 'omit',
    });
    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
  }

  // Stock Items
  async getStockItems(): Promise<StockItem[]> {
    const response = await fetch(`${API_BASE_URL}/stock`, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error('Failed to fetch stock items');
    }
    const stockItems = await response.json();
    
    // Convert MongoDB _id to id for frontend compatibility
    return stockItems.map((item: any) => ({
      ...item,
      id: item._id || item.id, // Use _id if available, fallback to id
      productId: item.productId // Keep productId as is
    }));
  }

  async updateStock(productId: string, quantity: number): Promise<StockItem> {
    console.log('Updating stock for product ID:', productId, 'with quantity:', quantity);
    
    // Ensure we have a valid productId
    if (!productId) {
      throw new Error('Invalid product ID: ' + productId);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/stock/product/${productId}`, {
        credentials: 'omit',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });
      
      // Get response text first
      const responseText = await response.text();
      console.log('Response from stock update:', responseText);
      
      // Try to parse as JSON if possible
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
      }
      
      if (!response.ok) {
        const errorMessage = data?.message || response.statusText || 'Failed to update stock';
        throw new Error(`Failed to update stock: ${errorMessage}`);
      }
      
      // Convert MongoDB _id to id for frontend compatibility if needed
      if (data && data._id && !data.id) {
        data.id = data._id;
      }
      
      return data;
    } catch (error) {
      console.error('Stock update error details:', error);
      throw error;
    }
  }

  async addStock(productId: string, quantity: number, dateExpected?: Date): Promise<StockItem> {
    const requestBody: any = { quantity };
    
    // Add date_expected if provided
    if (dateExpected) {
      requestBody.date_expected = dateExpected.toISOString();
    }
    
    const response = await fetch(`${API_BASE_URL}/stockin`, {
      credentials: 'omit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const text = await response.text();
    let data: any;
    if (text) {
      try { data = JSON.parse(text); } catch (e) {
        console.error('Failed to parse response as JSON:', e);
      }
    }
    
    if (!response.ok) {
      const errorMessage = data?.message || 'Failed to add stock';
      throw new Error(errorMessage);
    }
    
    return data;
  }

  async removeStock(productId: string, quantity: number): Promise<StockItem> {
    const response = await fetch(`${API_BASE_URL}/stock/remove/${productId}`, {
      credentials: 'omit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) {
      throw new Error('Failed to remove stock');
    }
    return response.json();
  }

  // Sales
  async getSales(): Promise<Sale[]> {
    const response = await fetch(`${API_BASE_URL}/sales`, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error('Failed to fetch sales');
    }
    const sales = await response.json();
    
    // Convert MongoDB _id to id for frontend compatibility
    return sales.map((sale: any) => ({
      ...sale,
      id: sale._id || sale.id // Use _id if available, fallback to id
    }));
  }

  async addSale(sale: Partial<Sale>): Promise<Sale> {
    if (!sale.customerName) {
      throw new Error('Customer name is required');
    }
    
    const response = await fetch(`${API_BASE_URL}/sales`, {
      credentials: 'omit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sale),
    });
    
    const text = await response.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
    }
    
    if (!response.ok) {
      const errorMessage = data?.message || 'Failed to add sale';
      try {
        console.error('Add sale error details:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          requestBody: sale,
          responseData: data,
          errorMessage
        });
      } catch (loggingError) {
        console.error('Error logging sale error details:', loggingError);
      }
      throw new Error(errorMessage);
    }
    
    return data;
  }

  // Purchases
  async getPurchases(): Promise<Purchase[]> {
    const response = await fetch(`${API_BASE_URL}/purchases`, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error('Failed to fetch purchases');
    }
    const purchases = await response.json();
    
    // Convert MongoDB _id to id for frontend compatibility
    return purchases.map((purchase: any) => ({
      ...purchase,
      id: purchase._id || purchase.id // Use _id if available, fallback to id
    }));
  }

  async addPurchase(purchase: Partial<Purchase>): Promise<Purchase> {
    if (!purchase.supplierName || !purchase.supplierId) {
      throw new Error('Supplier name and ID are required');
    }
    
    const response = await fetch(`${API_BASE_URL}/purchases`, {
      credentials: 'omit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(purchase),
    });
    
    const text = await response.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
    }
    
    if (!response.ok) {
      const errorMessage = data?.message || 'Failed to add purchase';
      throw new Error(errorMessage);
    }
    
    return data;
  }

  // Reports
  async getLowStockAlerts(): Promise<StockAlert[]> {
  const response = await fetch(`${API_BASE_URL}/reports/low-stock`, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error('Failed to fetch low stock alerts');
    }
    return response.json();
  }

  async getStockValue(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/reports/stock-value`, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error('Failed to fetch stock value');
    }
    const data = await response.json();
    return data.totalValue;
  }

  async getTotalSales(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/reports/total-sales`, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error('Failed to fetch total sales');
    }
    const data = await response.json();
    return data.totalSales;
  }

  // Supplier Performance
  async getSupplierPerformance(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/reports/supplier-performance`, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error('Failed to fetch supplier performance');
    }
    return response.json();
  }

  // Near Expiry Products (for discount campaigns)
  async getNearExpiryProducts(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/reports/near-expiry`, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error('Failed to fetch near expiry products');
    }
    return response.json();
  }
  
  // Delete a sale
  /**
   * Delete a sale with enhanced error handling
   * @param id Sale ID to delete
   * @param signal Optional AbortSignal to abort the request
   */
  async deleteSale(id: string, signal?: AbortSignal): Promise<void> {
    console.log(`Deleting sale with ID: ${id}`);
    
    // Input validation
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new ValidationError('Invalid sale ID: ID is required and must be a non-empty string');
    }
    
    // Clean the ID by removing any extra whitespace
    const cleanId = id.trim();
    
    try {
      // Create abort controller for timeout handling if not provided externally
      const controller = !signal ? new AbortController() : undefined;
      const timeoutId = !signal ? setTimeout(() => controller?.abort(), DEFAULT_TIMEOUT) : undefined;
      
      // Make the delete request with proper headers
      const response = await fetch(`${API_BASE_URL}/sales/${encodeURIComponent(cleanId)}`, {
        method: 'DELETE',
        credentials: 'omit',
        signal: signal || controller?.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }).finally(() => timeoutId && clearTimeout(timeoutId));
      
      // Get response content for better error handling
      let responseText: string;
      try {
        responseText = await response.text();
        console.log(`Delete sale response: ${responseText}`);
      } catch (textError) {
        console.error('Error reading response text:', textError);
        responseText = '';
      }
      
      // Process non-success responses
      if (!response.ok) {
        let errorData = null;
        try {
          if (responseText) {
            errorData = JSON.parse(responseText);
          }
        } catch (e) {
          // Continue with text response if JSON parsing fails
          console.warn('Response is not valid JSON:', e);
        }
        
        const errorMessage = errorData?.message || response.statusText || 'Unknown error';
        
        // Map HTTP status codes to appropriate error types
        if (response.status === 404) {
          throw new NotFoundError(`Sale not found: ${cleanId}`);
        } else if (response.status === 400) {
          throw new ValidationError(`Invalid sale data: ${errorMessage}`);
        } else {
          throw new ApiError(`Failed to delete sale: ${errorMessage}`, response.status);
        }
      }
    } catch (error) {
      console.error('Sale deletion error:', error);
      
      // Rethrow custom errors
      if (error instanceof ApiError ||
          error instanceof ValidationError ||
          error instanceof NotFoundError) {
        throw error;
      }
      
      // Handle abort/timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new NetworkError('Delete sale request timed out');
      }
      
      // Handle other errors
      if (error instanceof Error) {
        throw new ApiError(`Sale deletion failed: ${error.message}`);
      } else {
        throw new ApiError('Unknown error during sale deletion');
      }
    }
  }
  
  // Update a purchase
  async updatePurchase(id: string, purchase: Partial<Purchase>): Promise<Purchase> {
    // Validation for required fields if they are being updated
    if (purchase.supplierName === '' || purchase.supplierId === '') {
      throw new Error('Supplier name and ID are required');
    }
    
    const response = await fetch(`${API_BASE_URL}/purchases/${id}`, {
      credentials: 'omit',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(purchase),
    });
    
    const text = await response.text();
    let data: any;
    if (text) {
      try { data = JSON.parse(text); } catch (e) { 
        console.error('Failed to parse response as JSON:', e);
      }
    }
    if (!response.ok) {
      const message = data?.message || response.statusText || 'Failed to update purchase';
      throw new Error(message);
    }
    return data;
  }

  /**
   * Delete a purchase with enhanced error handling
   * @param id Purchase ID to delete
   * @param signal Optional AbortSignal to abort the request
   */
  async deletePurchase(id: string, signal?: AbortSignal): Promise<void> {
    console.log(`Deleting purchase with ID: ${id}`);
    
    // Input validation
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new ValidationError('Invalid purchase ID: ID is required and must be a non-empty string');
    }
    
    // Clean the ID by removing any extra whitespace
    const cleanId = id.trim();
    
    try {
      // Create abort controller for timeout handling if not provided externally
      const controller = !signal ? new AbortController() : undefined;
      const timeoutId = !signal ? setTimeout(() => controller?.abort(), DEFAULT_TIMEOUT) : undefined;
      
      // Make the delete request with proper headers
      const response = await fetch(`${API_BASE_URL}/purchases/${encodeURIComponent(cleanId)}`, {
        method: 'DELETE',
        credentials: 'omit',
        signal: signal || controller?.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }).finally(() => timeoutId && clearTimeout(timeoutId));
      
      // Get response content for better error handling
      let responseText: string;
      try {
        responseText = await response.text();
        console.log(`Delete purchase response: ${responseText}`);
      } catch (textError) {
        console.error('Error reading response text:', textError);
        responseText = '';
      }
      
      // Process non-success responses
      if (!response.ok) {
        let errorData = null;
        try {
          if (responseText) {
            errorData = JSON.parse(responseText);
          }
        } catch (e) {
          // Continue with text response if JSON parsing fails
          console.warn('Response is not valid JSON:', e);
        }
        
        const errorMessage = errorData?.message || response.statusText || 'Unknown error';
        
        // Map HTTP status codes to appropriate error types
        if (response.status === 404) {
          throw new NotFoundError(`Purchase not found: ${cleanId}`);
        } else if (response.status === 400) {
          throw new ValidationError(`Invalid purchase data: ${errorMessage}`);
        } else if (response.status === 409) {
          throw new BusinessError(`Cannot delete purchase: ${errorMessage}`);
        } else {
          throw new ApiError(`Failed to delete purchase: ${errorMessage}`, response.status);
        }
      }
    } catch (error) {
      console.error('Purchase deletion error:', error);
      
      // Rethrow custom errors
      if (error instanceof ApiError ||
          error instanceof ValidationError ||
          error instanceof NotFoundError ||
          error instanceof BusinessError) {
        throw error;
      }
      
      // Handle abort/timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new NetworkError('Delete purchase request timed out');
      }
      
      // Handle network connectivity issues
      if (!navigator.onLine) {
        throw new NetworkError('Network connection unavailable');
      }
      
      // Handle other errors
      if (error instanceof Error) {
        throw new ApiError(`Purchase deletion failed: ${error.message}`);
      } else {
        throw new ApiError('Unknown error during purchase deletion');
      }
    }
  }
  /**
   * Uploads an image file to the server
   * @param imageFile The file to upload
   * @returns Promise resolving to the URL of the uploaded image
   * @throws ApiError, NetworkError, ValidationError
   */
  async uploadImage(imageFile: File): Promise<string> {
    if (!imageFile) {
      throw new ValidationError('No image file provided');
    }
    
    // Validate file type
    if (!imageFile.type.match('image.*')) {
      throw new ValidationError('Invalid file type. Only images are allowed.');
    }
    
    // Create FormData and append the file
    const formData = new FormData();
    formData.append('image', imageFile);
    
    try {
      // Create an AbortController for timeout functionality
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds for image uploads
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to upload image';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If parsing fails, use the error text directly
          errorMessage = errorText || errorMessage;
        }
        throw new ApiError(errorMessage);
      }
      
      const data = await response.json();
      return data.url; // Return the URL to the uploaded image
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error.name === 'AbortError') {
        throw new NetworkError('Image upload request timed out');
      }
      throw new ApiError(`Image upload failed: ${error.message || 'Unknown error'}`);
    }
  }
}

const stockManagementService = new StockManagementService();
export default stockManagementService;