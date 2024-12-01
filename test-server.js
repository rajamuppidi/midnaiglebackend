const http = require('http');
const os = require('os');

function testEndpoint(host, port, path = '/') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  const port = 5001;
  const interfaces = os.networkInterfaces();
  
  console.log('\n=== Server Accessibility Test ===');
  
  // Test localhost
  try {
    console.log('\nTesting localhost...');
    const localhostResult = await testEndpoint('localhost', port);
    console.log('localhost:' + port + ' => OK');
    console.log('Status:', localhostResult.statusCode);
  } catch (error) {
    console.log('localhost:' + port + ' => FAILED');
    console.log('Error:', error.message);
  }
  
  // Test all network interfaces
  for (const [name, nets] of Object.entries(interfaces)) {
    for (const net of nets) {
      if (net.family === 'IPv4') {
        try {
          console.log(`\nTesting ${name} (${net.address})...`);
          const result = await testEndpoint(net.address, port);
          console.log(`${net.address}:${port} => OK`);
          console.log('Status:', result.statusCode);
        } catch (error) {
          console.log(`${net.address}:${port} => FAILED`);
          console.log('Error:', error.message);
        }
      }
    }
  }
}

// Run the tests
runTests().catch(console.error);