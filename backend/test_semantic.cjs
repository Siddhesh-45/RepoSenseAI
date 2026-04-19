const http = require('http');

const data = JSON.stringify({
  nodeId: "frontend/src/App.jsx",
  nodes: [{ id: "frontend/src/App.jsx", type: "entry", ai: "Test node" }],
  edges: []
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/semantic',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', error => console.error('Error:', error.message));
req.write(data);
req.end();
