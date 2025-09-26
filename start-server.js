const { exec } = require('child_process');
const path = require('path');

// Build the server
console.log('Building server...');
exec('npm run build-server', (error, stdout, stderr) => {
  if (error) {
    console.error(`Build error: ${error}`);
    return;
  }
  
  console.log('Server build completed successfully!');
  console.log('Starting server...');
  
  // Start the server
  exec('node dist/server.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Server start error: ${error}`);
      return;
    }
    
    console.log('Server started successfully!');
    console.log(stdout);
  });
});