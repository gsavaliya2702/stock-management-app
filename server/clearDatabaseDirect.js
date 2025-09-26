// Use direct MongoDB connection
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stockmanagement';

async function clearDatabase() {
  let client;
  
  try {
    console.log('Connecting to database...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('Connected to MongoDB. Starting database cleanup...');
    
    // Get database name from URI
    const dbName = MONGODB_URI.split('/').pop().split('?')[0];
    console.log(`Using database: ${dbName}`);
    
    const db = client.db(dbName);
    
    // Get collections
    const collections = await db.listCollections().toArray();
    
    // Delete all documents from each collection
    for (const collection of collections) {
      console.log(`Clearing ${collection.name} collection...`);
      await db.collection(collection.name).deleteMany({});
    }
    
    console.log('All collections have been cleared.');
    
    console.log('Database reset completed successfully.');
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  } finally {
    // Close connection
    if (client) {
      await client.close();
      console.log('Database connection closed.');
    }
  }
}

// Run the function
clearDatabase();
