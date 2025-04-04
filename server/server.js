const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const socketIO = require('socket.io');
const socketHandlers = require('./socket-handlers');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Define port
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve favicon.svg
app.get('/favicon.svg', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.sendFile(path.join(__dirname, '../public/favicon.svg'));
});

// Fallback for browsers that don't support SVG favicons
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/favicon.ico'));
});

// Serve index.html for all routes (SPA approach)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Initialize socket handlers
socketHandlers.init(io);

// Start the server
server.listen(PORT, '0.0.0.0',() => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open http://0.0.0.0:${PORT} in your browser`);
});