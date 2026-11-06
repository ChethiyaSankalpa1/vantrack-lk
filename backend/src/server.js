require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Make io accessible to controllers & routes
app.set('io', io);

// Socket.IO event handler
io.on('connection', (socket) => {
  console.log(`[Socket.IO] New client connected: ${socket.id}`);

  // Driver starts broadcasting trip location
  socket.on('driver:location-update', (data) => {
    // data: { tripId, vehicleId, latitude, longitude, speed, heading, timestamp }
    io.to(`trip_${data.tripId}`).emit('trip:location-changed', data);
  });

  // Parent joins trip room to receive live updates
  socket.on('parent:join-trip', (tripId) => {
    socket.join(`trip_${tripId}`);
    console.log(`[Socket.IO] Client ${socket.id} joined room trip_${tripId}`);
  });

  // Leave room
  socket.on('parent:leave-trip', (tripId) => {
    socket.leave(`trip_${tripId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/parent', require('./routes/parentRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/driver', require('./routes/driverRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Health check endpoint
app.get(['/api', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'VanTrack LK Smart School Transportation API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Root friendly route
app.get('/', (req, res) => {
  res.send('VanTrack LK Backend Service is Running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[VanTrack LK] Server running in ${process.env.NODE_ENV || 'development'} mode on http://0.0.0.0:${PORT}`);
});

module.exports = { app, server, io };
