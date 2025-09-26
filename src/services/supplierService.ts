import { Supplier } from '../types';
import { 
  ApiError, 
  NotFoundError, 
  ValidationError, 
  NetworkError, 
  handleApiError 
} from './serviceErrors';

// Base API URL
const API_BASE_URL = 'http://localhost:5000/api';

// Default request timeout in milliseconds
const DEFAULT_TIMEOUT = 10000; // 10 seconds

class SupplierService {
  async getSuppliers(): Promise<Supplier[]> {
    const response = await fetch(`${API_BASE_URL}/suppliers`);
    if (!response.ok) {
      throw new Error('Failed to fetch suppliers');
    }
    const suppliers = await response.json();
    
    console.log('Suppliers from backend:', suppliers);
    
    // Convert MongoDB _id to id for frontend compatibility
    // And map backend field names to frontend field names
    return suppliers.map((supplier: any) => ({
      id: supplier._id || supplier.id, // Use _id if available, fallback to id
      name: supplier.supplier_name || '',
      contactInfo: supplier.contact_number || '',
      // Use default values for metrics if not available
      performanceScore: supplier.performanceScore || 0,
      deliverySpeedAvg: supplier.deliverySpeedAvg || 0,
      qualityRatingAvg: supplier.qualityRatingAvg || 0,
      reliabilityScore: supplier.reliabilityScore || 0,
      totalDeliveries: supplier.totalDeliveries || 0
    }));
  }

  async addSupplier(supplier: { name: string; contactInfo: string }): Promise<Supplier> {
    // Map frontend field names to backend field names
    const backendSupplier = {
      supplier_name: supplier.name,
      contact_number: supplier.contactInfo,
      address: supplier.contactInfo // Using contactInfo for address too since we don't have a separate field
    };
    
    console.log('Sending supplier data to backend:', backendSupplier);
    
    const response = await fetch(`${API_BASE_URL}/suppliers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendSupplier),
    });
    
    if (!response.ok) {
      // Get more detailed error information
      const errorText = await response.text();
      console.error('Supplier creation error response:', errorText);
      throw new Error('Failed to add supplier');
    }
    
    return response.json();
  }

  async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    // Map frontend field names to backend field names
    const backendSupplier: any = {};
    
    if (supplier.name !== undefined) {
      backendSupplier.supplier_name = supplier.name;
    }
    
    if (supplier.contactInfo !== undefined) {
      backendSupplier.contact_number = supplier.contactInfo;
      backendSupplier.address = supplier.contactInfo; // Using contactInfo for address too
    }
    
    console.log('Sending supplier update to backend:', backendSupplier);
    
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendSupplier),
    });
    
    if (!response.ok) {
      // Get more detailed error information
      const errorText = await response.text();
      console.error('Supplier update error response:', errorText);
      throw new Error('Failed to update supplier');
    }
    
    return response.json();
  }

  /**
   * Delete a supplier with enhanced error handling
   * @param id ID of the supplier to delete
   * @throws ValidationError, NotFoundError, ApiError, NetworkError
   */
  async deleteSupplier(id: string): Promise<void> {
    console.log(`Deleting supplier with ID: ${id}`);
    
    // Input validation
    if (!id) {
      throw new ValidationError('Supplier ID is required');
    }
    
    if (typeof id !== 'string' || id.trim() === '') {
      throw new ValidationError('Invalid supplier ID format');
    }
    
    try {
      // Create an AbortController for timeout functionality
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
      
      // Make the API request with timeout
      const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
        method: 'DELETE',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, text/plain, */*'
        }
      }).finally(() => clearTimeout(timeoutId));
      
      // Handle specific status codes before trying to read response
      if (response.status === 404) {
        throw new NotFoundError(`Supplier with ID ${id} not found`);
      }
      
      // Get response text for detailed error info
      let responseText = '';
      try {
        responseText = await response.text();
        console.log(`Delete supplier response: ${responseText}`);
      } catch (e) {
        console.warn('Could not read response text:', e);
      }
      
      if (!response.ok) {
        // Try to parse as JSON if possible
        let errorData = null;
        if (responseText) {
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            // Ignore parse error
          }
        }
        
        // Determine appropriate error type based on status code
        if (response.status === 400) {
          throw new ValidationError(errorData?.message || 'Invalid supplier deletion request');
        } else if (response.status === 409) {
          throw new ApiError('Cannot delete supplier with associated products or purchases', 409);
        } else {
          // Use the general API error handler for other cases
          return handleApiError(response, `Failed to delete supplier with ID ${id}`);
        }
      }
    } catch (error) {
      // Handle specific error types
      if (error instanceof ValidationError || 
          error instanceof NotFoundError || 
          error instanceof ApiError ||
          error instanceof NetworkError) {
        // Rethrow known error types
        throw error;
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('Delete supplier request timed out');
        throw new NetworkError(`Request timed out while deleting supplier ${id}`);
      } else if (!navigator.onLine) {
        // Check connection status
        throw new NetworkError('Network connection issue while deleting supplier');
      } else {
        // For other errors, log and rethrow as ApiError
        console.error('Supplier deletion error:', error);
        throw new ApiError(`Failed to delete supplier: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
}

const supplierService = new SupplierService();
export default supplierService;