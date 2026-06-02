const http = require('http');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: `/api/v1${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseBody
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(data);
    }
    req.end();
  });
}

async function runTests() {
  try {
    console.log('--- TESTING GET /products/11/reviews ---');
    const getRes = await makeRequest('GET', '/products/11/reviews');
    console.log('GET Response:', getRes);

    console.log('\n--- TESTING POST /products/11/reviews ---');
    const postRes = await makeRequest('POST', '/products/11/reviews', {
      rating: 5,
      comment: 'Testing review submission',
      images: []
    });
    console.log('POST Response:', postRes);
  } catch (err) {
    console.error('Request failed:', err);
  }
}

runTests();
