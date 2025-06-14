// app.js
require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const path = require('path');

// Import modules
const config = require('./config/config');
const apiRoutes = require('./routes/api');
const { notFoundHandler, errorHandler, requestLogger } = require('./middleware/errorHandler');

const app = express();

// --- Middleware Setup ---

// Request logging
app.use(requestLogger);

// Parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(config.publicDir));

// Serve video files statically
app.use('/video-showcase/videos', express.static(config.videosDir));

// API Routes
app.use('/api', apiRoutes);

// --- Error Handling ---

// Handle 404 (Not Found) errors
app.use(notFoundHandler);

// General error handler
app.use(errorHandler);

// --- Server Start ---

// Start the server and listen for incoming requests
app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
  console.log(`Access the homepage: http://localhost:${config.port}/`);
  console.log(`Static files are served from: ${config.publicDir}`);
  console.log(`Videos are served from: ${config.videosDir}`);
});