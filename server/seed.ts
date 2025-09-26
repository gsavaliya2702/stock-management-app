import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product';
import Category from './models/Category';
import Supplier from './models/Supplier';
import Customer from './models/Customer';
import StockIn from './models/StockIn';
import StockOut from './models/StockOut';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockmanagement';

// Helper function to create expiry date from days
const expiryDateFromDays = (days: number): Date => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

// Helper function to generate random date within range
const randomDateInRange = (startDays: number, endDays: number): Date => {
  const randomDays = Math.floor(Math.random() * (endDays - startDays + 1)) + startDays;
  return new Date(Date.now() + randomDays * 24 * 60 * 60 * 1000);
};

// Helper function to generate random date in the past
const randomPastDate = (daysAgo: number): Date => {
  const randomDays = Math.floor(Math.random() * daysAgo) + 1;
  return new Date(Date.now() - randomDays * 24 * 60 * 60 * 1000);
};

// Helper function to generate random positive integer
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

async function seedDatabase() {
  try {
    // Validate environment variables
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Connect to MongoDB with explicit options
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Clear existing data with confirmation
    console.log('\n🧹 Clearing existing data...');
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Supplier.deleteMany({});
    await Customer.deleteMany({});
    await StockIn.deleteMany({});
    await StockOut.deleteMany({});
    console.log('✅ Cleared all existing data');

    // Create categories with South Australian produce focus
    console.log('\n🌱 Creating categories...');
    const categories = await Category.insertMany([
      { category_name: 'Fruits' },
      { category_name: 'Vegetables' },
      { category_name: 'Herbs & Spices' },
      { category_name: 'Berries' },
      { category_name: 'Citrus' },
      { category_name: 'Leafy Greens' },
      { category_name: 'Root Vegetables' },
      { category_name: 'Stone Fruits' }
    ]);
    console.log(`✅ Inserted ${categories.length} categories`);

    // Map categories for easy access
    const categoryMap = new Map(categories.map(cat => [cat.category_name.toLowerCase(), cat._id]));

    // Create South Australian suppliers
    console.log('\n🚛 Creating South Australian suppliers...');
    const suppliers = await Supplier.insertMany([
      {
        supplier_name: 'Adelaide Fresh Produce',
        contact_number: '+61 8 8234 5678',
        address: '45 King William Street, Adelaide SA 5000',
        performanceScore: 4.5,
        deliverySpeedAvg: 1.2,
        qualityRatingAvg: 4.7,
        reliabilityScore: 95,
        totalDeliveries: 156
      },
      {
        supplier_name: 'Riverland Orchards',
        contact_number: '+61 8 8521 3456',
        address: '123 Murray Valley Highway, Berri SA 5343',
        performanceScore: 4.8,
        deliverySpeedAvg: 1.5,
        qualityRatingAvg: 4.9,
        reliabilityScore: 98,
        totalDeliveries: 203
      },
      {
        supplier_name: 'Barossa Valley Growers',
        contact_number: '+61 8 8562 7890',
        address: '78 Sturt Highway, Nuriootpa SA 5355',
        performanceScore: 4.6,
        deliverySpeedAvg: 1.8,
        qualityRatingAvg: 4.8,
        reliabilityScore: 92,
        totalDeliveries: 178
      },
      {
        supplier_name: 'Fleurieu Peninsula Farms',
        contact_number: '+61 8 8552 1234',
        address: '45 Victor Harbor Road, McLaren Vale SA 5171',
        performanceScore: 4.4,
        deliverySpeedAvg: 2.1,
        qualityRatingAvg: 4.6,
        reliabilityScore: 89,
        totalDeliveries: 134
      }
    ]);
    console.log(`✅ Inserted ${suppliers.length} South Australian suppliers`);

    // Create South Australian customers
    console.log('\n🏪 Creating South Australian customers...');
    const customers = await Customer.insertMany([
      {
        customer_name: 'Adelaide Central Market',
        contact_number: '+61 8 8410 0444',
        address: '44-60 Grote Street, Adelaide SA 5000'
      },
      {
        customer_name: 'Hahndorf Fresh Market',
        contact_number: '+61 8 8388 7288',
        address: '2-10 Main Street, Hahndorf SA 5242'
      },
      {
        customer_name: 'Melbourne Market Wholesalers',
        contact_number: '+61 3 9419 5555',
        address: '5-1 Market Boulevard, Epping VIC 3076'
      },
      {
        customer_name: 'Sydney Fresh Produce Co',
        contact_number: '+61 2 9267 3333',
        address: '10 Flemington Road, Flemington NSW 2141'
      }
    ]);
    console.log(`✅ Inserted ${customers.length} customers`);

    // Create South Australian products with realistic data
    console.log('\n🍎 Creating South Australian products...');
    const products = await Product.insertMany([
      // Fruits
      {
        name: 'Royal Gala Apples',
        categoryId: categoryMap.get('fruits'),
        unit: 'kg',
        pricePerUnit: 4.99,
        stockQuantity: 200,
        expiryDate: expiryDateFromDays(14),
        supplierId: suppliers[1]._id // Riverland Orchards
      },
      {
        name: 'Granny Smith Apples',
        categoryId: categoryMap.get('fruits'),
        unit: 'kg',
        pricePerUnit: 5.49,
        stockQuantity: 180,
        expiryDate: expiryDateFromDays(16),
        supplierId: suppliers[1]._id // Riverland Orchards
      },
      {
        name: 'Navel Oranges',
        categoryId: categoryMap.get('citrus'),
        unit: 'kg',
        pricePerUnit: 3.99,
        stockQuantity: 150,
        expiryDate: expiryDateFromDays(21),
        supplierId: suppliers[0]._id // Adelaide Fresh Produce
      },
      {
        name: 'Valencia Oranges',
        categoryId: categoryMap.get('citrus'),
        unit: 'kg',
        pricePerUnit: 3.79,
        stockQuantity: 120,
        expiryDate: expiryDateFromDays(19),
        supplierId: suppliers[0]._id // Adelaide Fresh Produce
      },
      {
        name: 'Red Delicious Apples',
        categoryId: categoryMap.get('fruits'),
        unit: 'kg',
        pricePerUnit: 4.29,
        stockQuantity: 160,
        supplierId: suppliers[1]._id // Riverland Orchards
      },
      {
        name: 'Pink Lady Apples',
        categoryId: categoryMap.get('fruits'),
        unit: 'kg',
        pricePerUnit: 5.99,
        stockQuantity: 140,
        expiryDate: expiryDateFromDays(18),
        supplierId: suppliers[1]._id // Riverland Orchards
      },
      
      // Berries
      {
        name: 'Strawberries',
        categoryId: categoryMap.get('berries'),
        unit: 'punnet',
        pricePerUnit: 6.99,
        stockQuantity: 80,
        expiryDate: expiryDateFromDays(5),
        supplierId: suppliers[3]._id // Fleurieu Peninsula Farms
      },
      {
        name: 'Blueberries',
        categoryId: categoryMap.get('berries'),
        unit: 'punnet',
        pricePerUnit: 8.99,
        stockQuantity: 60,
        expiryDate: expiryDateFromDays(7),
        supplierId: suppliers[3]._id // Fleurieu Peninsula Farms
      },
      {
        name: 'Raspberries',
        categoryId: categoryMap.get('berries'),
        unit: 'punnet',
        pricePerUnit: 9.99,
        stockQuantity: 45,
        expiryDate: expiryDateFromDays(4),
        supplierId: suppliers[3]._id // Fleurieu Peninsula Farms
      },
      
      // Stone Fruits
      {
        name: 'Peaches',
        categoryId: categoryMap.get('stone fruits'),
        unit: 'kg',
        pricePerUnit: 7.99,
        stockQuantity: 100,
        expiryDate: expiryDateFromDays(6),
        supplierId: suppliers[2]._id // Barossa Valley Growers
      },
      {
        name: 'Nectarines',
        categoryId: categoryMap.get('stone fruits'),
        unit: 'kg',
        pricePerUnit: 8.49,
        stockQuantity: 90,
        expiryDate: expiryDateFromDays(5),
        supplierId: suppliers[2]._id // Barossa Valley Growers
      },
      {
        name: 'Plums',
        categoryId: categoryMap.get('stone fruits'),
        unit: 'kg',
        pricePerUnit: 6.99,
        stockQuantity: 110,
        expiryDate: expiryDateFromDays(7),
        supplierId: suppliers[2]._id // Barossa Valley Growers
      },
      
      // Vegetables
      {
        name: 'Carrots',
        categoryId: categoryMap.get('root vegetables'),
        unit: 'kg',
        pricePerUnit: 2.49,
        stockQuantity: 300,
        supplierId: suppliers[0]._id // Adelaide Fresh Produce
      },
      {
        name: 'Potatoes',
        categoryId: categoryMap.get('root vegetables'),
        unit: 'kg',
        pricePerUnit: 1.99,
        stockQuantity: 400,
        supplierId: suppliers[0]._id // Adelaide Fresh Produce
      },
      {
        name: 'Onions',
        categoryId: categoryMap.get('root vegetables'),
        unit: 'kg',
        pricePerUnit: 1.79,
        stockQuantity: 350,
        supplierId: suppliers[0]._id // Adelaide Fresh Produce
      },
      {
        name: 'Broccoli',
        categoryId: categoryMap.get('vegetables'),
        unit: 'head',
        pricePerUnit: 3.99,
        stockQuantity: 120,
        expiryDate: expiryDateFromDays(8),
        supplierId: suppliers[0]._id // Adelaide Fresh Produce
      },
      {
        name: 'Cauliflower',
        categoryId: categoryMap.get('vegetables'),
        unit: 'head',
        pricePerUnit: 4.49,
        stockQuantity: 100,
        expiryDate: expiryDateFromDays(10),
        supplierId: suppliers[0]._id // Adelaide Fresh Produce
      },
      {
        name: 'Spinach',
        categoryId: categoryMap.get('leafy greens'),
        unit: 'bag',
        pricePerUnit: 4.99,
        stockQuantity: 80,
        expiryDate: expiryDateFromDays(4),
        supplierId: suppliers[3]._id // Fleurieu Peninsula Farms
      },
      {
        name: 'Cos Lettuce',
        categoryId: categoryMap.get('leafy greens'),
        unit: 'head',
        pricePerUnit: 2.99,
        stockQuantity: 150,
        expiryDate: expiryDateFromDays(7),
        supplierId: suppliers[0]._id // Adelaide Fresh Produce
      },
      {
        name: 'Baby Spinach',
        categoryId: categoryMap.get('leafy greens'),
        unit: 'bag',
        pricePerUnit: 5.49,
        stockQuantity: 90,
        expiryDate: expiryDateFromDays(5),
        supplierId: suppliers[3]._id // Fleurieu Peninsula Farms
      },
      
      // Herbs & Spices
      {
        name: 'Fresh Basil',
        categoryId: categoryMap.get('herbs & spices'),
        unit: 'bunch',
        pricePerUnit: 2.99,
        stockQuantity: 60,
        expiryDate: expiryDateFromDays(5),
        supplierId: suppliers[3]._id // Fleurieu Peninsula Farms
      },
      {
        name: 'Parsley',
        categoryId: categoryMap.get('herbs & spices'),
        unit: 'bunch',
        pricePerUnit: 2.49,
        stockQuantity: 70,
        expiryDate: expiryDateFromDays(6),
        supplierId: suppliers[3]._id // Fleurieu Peninsula Farms
      },
      {
        name: 'Mint',
        categoryId: categoryMap.get('herbs & spices'),
        unit: 'bunch',
        pricePerUnit: 2.79,
        stockQuantity: 50,
        expiryDate: expiryDateFromDays(4),
        supplierId: suppliers[3]._id // Fleurieu Peninsula Farms
      }
    ]);
    console.log(`✅ Inserted ${products.length} South Australian products`);

    // Create stock-in records with realistic data
    console.log('\n📦 Creating stock-in records...');
    const stockInRecords: any[] = [];
    
    for (const product of products) {
      // Generate multiple stock-in entries for each product with varying dates
      const numEntries = randomInt(1, 3);
      
      for (let i = 0; i < numEntries; i++) {
        const quantity = randomInt(20, 100);
        const dateReceived = randomPastDate(30); // Within last 30 days
        const dateExpected = randomDateInRange(-5, 2); // Expected between 5 days ago and 2 days from now
        
        stockInRecords.push({
          product_id: product._id,
          supplier_id: product.supplierId,
          quantity,
          date_received: dateReceived,
          date_expected: dateExpected
        });
      }
    }

    await StockIn.insertMany(stockInRecords);
    console.log(`✅ Inserted ${stockInRecords.length} stock-in records`);

    // Create stock-out records with realistic data
    console.log('\n🚚 Creating stock-out records...');
    const stockOutRecords: any[] = [];
    
    // Select random products for stock-out
    const productsForStockOut = [...products].sort(() => 0.5 - Math.random()).slice(0, 15);
    
    for (const product of productsForStockOut) {
      const numEntries = randomInt(1, 3);
      
      for (let i = 0; i < numEntries; i++) {
        const quantity = randomInt(5, 30);
        const dateDispatched = randomPastDate(14); // Within last 14 days
        const customerId = customers[Math.floor(Math.random() * customers.length)]._id;
        
        stockOutRecords.push({
          product_id: product._id,
          customer_id: customerId,
          quantity,
          date_dispatched: dateDispatched
        });
      }
    }

    await StockOut.insertMany(stockOutRecords);
    console.log(`✅ Inserted ${stockOutRecords.length} stock-out records`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📍 South Australian produce data has been populated.');
    console.log('📊 Summary:');
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${suppliers.length} suppliers`);
    console.log(`   - ${customers.length} customers`);
    console.log(`   - ${products.length} products`);
    console.log(`   - ${stockInRecords.length} stock-in records`);
    console.log(`   - ${stockOutRecords.length} stock-out records`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error seeding database:');
    console.error(`   Message: ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Execute the seeding function
seedDatabase().catch(error => {
  console.error('Failed to execute database seeding:', error);
  process.exit(1);
});
