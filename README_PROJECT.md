# Fruit & Vegetable Stock Management System - Project Setup Guide

A professional stock management application for fruits and vegetables built with React, TypeScript, Material-UI, Node.js, Express, and MongoDB.

## Quick Start - Windows

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm (v6 or higher)

### Installing Required Software

#### 1. Install Node.js and npm
Node.js includes npm (Node Package Manager). Follow these steps:

1. Visit the official Node.js website: https://nodejs.org/
2. Download the LTS (Long Term Support) version for Windows
3. Run the installer and follow the setup wizard (accept all default settings)
4. After installation, open a command prompt and verify the installation:
   ```
   node --version
   npm --version
   ```
   You should see version numbers confirming both are installed.

#### 2. Install MongoDB
MongoDB is a NoSQL database that stores data in JSON-like documents:

1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Select the Windows MSI installer
3. Run the installer and follow these steps during installation:
   - Choose "Complete" installation type
   - For Service Configuration, select "Config as Windows Service"
   - Set the data directory to: `C:\data\db`
   - Leave MongoDB Compass deselected (optional GUI tool)
4. After installation, open a command prompt and verify MongoDB is installed:
   ```
   mongod --version
   ```
   If MongoDB is not in your PATH, you may need to start it manually from the installation directory.

#### 3. Install Git (Optional, for cloning the repository)
If you don't have Git installed:

1. Download Git for Windows from: https://git-scm.com/download/win
2. Run the installer and accept all default settings
3. Verify installation:
   ```
   git --version
   ```

### Step-by-Step Setup

1. **Clone the repository** (if not already done):
   ```
   git clone <repository-url>
   cd stock-management-app
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Create MongoDB data directory** (if not exists):
   ```
   mkdir C:\data\db
   ```

4. **Start MongoDB server**:
   ```
   mongod C:/data/db
   ```
   *Keep this terminal window open as MongoDB needs to run continuously.*

5. **Open a new terminal** and build the server:
   ```
   npm run build-server
   ```

6. **Seed the database** with sample data:
   ```
   node dist/server/seed.js
   ```

7. **Start the backend server**:
   ```
   npm run server
   ```
   *This will start the API server on http://localhost:5000*

8. **Open a third terminal** and start the frontend:
   ```
   npm start
   ```
   *This will start the React app on http://localhost:3000*

## Detailed Project Information

### Features

- Dashboard: Overview of stock levels, low stock alerts, and key metrics
- Product Management: Add, edit, and delete products with categories and pricing
- Stock Tracking: Monitor current stock levels and update quantities
- Sales Management: Record sales transactions with customer information
- Purchase Management: Track purchases from suppliers with payment history
- Supplier Performance Tracking: Rate suppliers based on delivery speed, quality, and reliability
- Reporting: View low stock alerts, product summaries, and supplier performance
- Payment History: Track all payment transactions

### Technologies Used

- Frontend: React with TypeScript, Material-UI for components and styling
- Backend: Node.js with Express framework
- Database: MongoDB with Mongoose ODM
- Development Tools: Nodemon for server reloading

### Project Structure

```
stock-management-app/
├── src/                          # Frontend React application
│   ├── components/               # Reusable UI components
│   ├── pages/                    # Page components for each route
│   ├── services/                 # Data services for API communication
│   ├── types/                    # TypeScript interfaces and types
│   └── utils/                    # Utility functions
├── server/                       # Backend Node.js/Express application
│   ├── models/                   # Mongoose data models
│   │   ├── Product.ts           # Product model with stock tracking
│   │   ├── StockItem.ts         # Stock inventory tracking
│   │   ├── StockOut.ts          # Sales records
│   │   ├── StockIn.ts           # Purchase records
│   │   ├── Sale.ts              # Legacy sales model
│   │   ├── Purchase.ts          # Purchase model
│   │   ├── Customer.ts          # Customer information
│   │   ├── Supplier.ts          # Supplier information
│   │   ├── Category.ts          # Product categories
│   │   └── PaymentHistory.ts    # Payment transaction records
│   ├── routes/                   # Express route handlers
│   │   ├── products.ts          # Product management API
│   │   ├── stock.ts             # Stock tracking API
│   │   ├── sales.ts             # Sales management API
│   │   ├── purchases.ts         # Purchase management API
│   │   ├── suppliers.ts         # Supplier management API
│   │   ├── customers.ts         # Customer management API
│   │   ├── categories.ts        # Category management API
│   │   ├── reports.ts           # Reporting API
│   │   └── paymentHistory.ts    # Payment history API
│   ├── server.ts                 # Server entry point
│   └── seed.ts                   # Database seeding script
├── public/                       # Static assets
├── package.json                  # Project dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

### API Endpoints

- Products: `/api/products` - CRUD operations for products
- Stock: `/api/stock` - Stock tracking and management
- Sales: `/api/sales` - Sales recording and management
- Purchases: `/api/purchases` - Purchase tracking with payment status
- Suppliers: `/api/suppliers` - Supplier management
- Customers: `/api/customers` - Customer management
- Categories: `/api/categories` - Product categories
- Reports: `/api/reports` - Various reports (low stock, total sales, etc.)
- Payment History: `/api/payment-history` - Payment transaction records

### Available Scripts

- `npm start`: Runs the frontend React app in development mode
- `npm run server`: Runs the backend Express server with Nodemon
- `npm run build-server`: Compiles the TypeScript server code
- `npm run dev`: Runs both frontend and backend servers concurrently
- `npm test`: Launches the test runner
- `npm run build`: Builds the React app for production
- `npm run eject`: Removes the single build dependency (use with caution)

### Database Schema

The application uses MongoDB with the following main collections:

1. Products: Store product information including name, category, price, and stock quantity
2. StockItems: Track inventory movements and current stock levels
3. StockOut: Record sales transactions
4. StockIn: Record purchase transactions
5. Customers: Store customer information
6. Suppliers: Store supplier information
7. Categories: Product categorization
8. PaymentHistory: Track all payment transactions

### Important Notes

1. MongoDB must be running before starting the application
2. Database seeding should be done after the first installation to populate with sample data
3. Port usage:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
4. Stock Management: The system uses a dual-model approach where Product model stores general information and StockItem model tracks current inventory levels
5. Sales Recording: Sales are recorded in StockOut collection and update StockItem quantities
6. Payment Tracking: All payment transactions are recorded in PaymentHistory collection

### Troubleshooting

1. MongoDB connection errors:
   - Ensure MongoDB is installed and running
   - Verify the data directory path (C:\data\db)
   - Check if any other service is using the default MongoDB port (27017)

2. Port already in use:
   - Check if other instances of the app are running
   - Use different ports by updating the configuration in server.ts and package.json

3. Build errors:
   - Run `npm install` to ensure all dependencies are installed
   - Check Node.js and npm versions meet prerequisites

### Future Enhancements

- User authentication and authorization
- Advanced reporting with charts and graphs
- Barcode scanning for quick product identification
- Inventory forecasting based on sales trends
- Email notifications for low stock alerts
- Mobile application version

---

For additional information, refer to the main [README.md](README.md) file.