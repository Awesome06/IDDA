const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

// Enable CORS to allow requests from your React app (usually localhost:3000 or 5173)
app.use(cors());
app.use(express.json());

// --- MOCK DATABASE DATA (Moved from React to here) ---
const databases = [
  {
    id: 1,
    name: 'e_commerce_db',
    tables: [
      { name: 'users', rows: 1500, size: '2MB' },
      { name: 'orders', rows: 45000, size: '120MB' },
      { name: 'products', rows: 300, size: '5MB' },
    ]
  },
  {
    id: 2,
    name: 'analytics_logs',
    tables: [
      { name: 'page_views', rows: 1200000, size: '4GB' },
      { name: 'events', rows: 800000, size: '2.5GB' },
    ]
  },
  // ... add more as needed
];

// API Endpoint to get all databases
app.get('/api/databases', (req, res) => {
  res.json(databases);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});