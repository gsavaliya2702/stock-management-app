export interface Product {
  id: string;
  name: string;
  category?: string;     // Frontend display name from categoryId
  categoryId: string;    // MongoDB ObjectId reference
  unit: string;          // kg, bunch, piece, etc.
  price: number;         // Frontend display (maps to pricePerUnit)
  pricePerUnit?: number; // Backend field name
  stockQuantity?: number;// Current stock level
  image?: string;
  expiryDate?: Date;     // For discount feature
  expiryDays?: number;   // Frontend field for days until expiry
  supplierId: string;    // Required for supplier performance tracking
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StockItem {
  id: string;
  productId: string;
  quantity: number;
  lastUpdated: Date;
  minStockLevel: number;
  location?: string; // For warehouse tracking
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Sale {
  _id: string;
  productId: string;
  productName?: string; // Added for backend compatibility
  quantity: number;
  totalPrice: number;
  date: Date;
  customerName: string; // Required to match backend model
  contactNumber?: string; // Optional field
  address?: string; // Optional field
  discountApplied?: number; // For discount feature
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Purchase {
  id: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  date: Date;
  supplierName: string; // Required to match backend model
  supplierId: string; // Required for supplier performance tracking
  deliveryDate?: Date; // For supplier performance tracking
  qualityRating?: number; // For supplier performance tracking (1-5)
  paymentTransactionId?: string; // For payment tracking
  paymentStatus?: 'pending' | 'paid' | 'failed'; // For payment tracking
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStockLevel: number;
}

export interface Supplier {
  id: string;
  name: string;
  supplier_name?: string; // For backward compatibility with backend
  contactInfo: string;
  contact_number?: string; // For backward compatibility with backend
  address?: string;
  performanceScore: number; // Average rating
  deliverySpeedAvg: number; // Average delivery time in days
  qualityRatingAvg: number; // Average quality rating (1-5)
  reliabilityScore: number; // Percentage of on-time deliveries
  totalDeliveries: number;
  createdAt?: Date;
  updatedAt?: Date;
}