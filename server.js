
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Hostinger environment port
const PORT = process.env.PORT || 3000;

// Path to the database file
const DB_FILE = path.join(__dirname, 'db.json');

app.use(express.json());

// 1. CUSTOM MIME TYPE MIDDLEWARE
// This is the CRITICAL fix for the blank screen.
// Browsers won't execute .tsx files unless served as 'application/javascript'.
app.use((req, res, next) => {
  if (req.url.endsWith('.tsx') || req.url.endsWith('.ts')) {
    res.setHeader('Content-Type', 'application/javascript');
  }
  next();
});

// Initialize DB structure
const initialData = {
  users: [],
  classes: [],
  attendance: [],
  payments: [],
  packages: [
    { id: 'p1', name: 'Starter Pack', credits: 5, price: 50 },
    { id: 'p2', name: 'Value Pack', credits: 12, price: 100 },
    { id: 'p3', name: 'Pro Pack', credits: 30, price: 220 }
  ]
};

const initializeDB = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
  } catch (e) {
    console.error('DB Init Error:', e.message);
  }
};
initializeDB();

// Health check for Hostinger diagnostics
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Data API
app.get('/api/data', (req, res) => {
  try {
    const rawData = fs.readFileSync(DB_FILE, 'utf8');
    res.json(JSON.parse(rawData));
  } catch (err) {
    res.status(500).json({ error: 'DB Read Error' });
  }
});

app.post('/api/data', (req, res) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'DB Write Error' });
  }
});

// Serve static files
app.use(express.static(__dirname));

// SPA Routing: Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
