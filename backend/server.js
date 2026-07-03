require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

// Initialize server
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Global Middlewares
app.use(cors()); // Allow requests from React Native apps/emulators/browsers
app.use(express.json()); // Parse incoming JSON request bodies

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);

// Root Health Check Route
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Interview Tracker Cyber API is active.' 
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Global Error]', err.stack);
  res.status(500).json({ 
    message: 'An unexpected internal server error occurred.' 
  });
});

// Start HTTP Listener
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Listening on http://0.0.0.0:${PORT}`);
  console.log(`[Server] Local Access: http://localhost:${PORT}`);
});
