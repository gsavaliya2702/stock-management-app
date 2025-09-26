import StockService from '../services/stockService';

async function testAPI() {
  try {
    console.log('Testing API connection...');
    
    // Test getting products
    const products = await StockService.getProducts();
    console.log(`✓ Successfully fetched ${products.length} products`);
    
    // Test getting stock items
    const stockItems = await StockService.getStockItems();
    console.log(`✓ Successfully fetched ${stockItems.length} stock items`);
    
    // Test getting sales
    const sales = await StockService.getSales();
    console.log(`✓ Successfully fetched ${sales.length} sales`);
    
    // Test getting purchases
    const purchases = await StockService.getPurchases();
    console.log(`✓ Successfully fetched ${purchases.length} purchases`);
    
    console.log('All API tests passed!');
    return true;
  } catch (error) {
    console.error('API test failed:', error);
    return false;
  }
}

testAPI();