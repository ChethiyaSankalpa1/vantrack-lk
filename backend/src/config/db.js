const dns = require('dns');
// Set Google & Cloudflare DNS to avoid querySrv ECONNREFUSED on Windows / local ISPs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (_) {}

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vantrack_lk';

  // Event listeners for MongoDB connection state
  mongoose.connection.on('connected', () => {
    console.log(`[MongoDB] Successfully connected to database: ${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[MongoDB] Connection runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected from database. Attempting reconnect...');
  });

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of hanging
    });
    console.log(`[MongoDB] Host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('====================================================');
    console.error('⚠️ [MongoDB Connection Warning]');
    console.error(`Message: ${error.message}`);
    console.error('If you are connecting to MongoDB Atlas:');
    console.error('1. Check that your Network Access whitelist in Atlas includes 0.0.0.0/0 (allow from anywhere).');
    console.error('2. Ensure your Atlas Database User username and password are correct in .env (MONGODB_URI).');
    console.error('3. If your password has special characters (@, #, %, etc.), ensure it is URL-encoded.');
    console.error('If using local MongoDB, ensure MongoDB service is running (mongod).');
    console.error('====================================================');
    return null;
  }
};

module.exports = connectDB;
