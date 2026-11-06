const path = require('path');
const dns = require('dns');
// Set reliable DNS servers (Google + Cloudflare) to prevent SRV lookup ECONNREFUSED on local ISPs/Windows
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function runDiagnostics() {
  console.log('====================================================');
  console.log('   VanTrack LK — Services & Infrastructure Health Check');
  console.log('====================================================\n');

  let dbOk = false;
  let cloudinaryOk = false;

  // 1. Check MongoDB Atlas
  console.log('[1/2] Testing MongoDB Atlas Connection...');
  console.log(`URI: ${process.env.MONGODB_URI.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`);
  const startTime = Date.now();
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    const latency = Date.now() - startTime;
    console.log(`✅ MongoDB Atlas Connected Successfully! (${latency} ms)`);
    console.log(`   Database Name : ${conn.connection.name}`);
    console.log(`   Cluster Host  : ${conn.connection.host}`);
    
    // Check existing collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`   Collections   : ${collections.length} found (${collections.map(c => c.name).join(', ') || 'none yet'})`);
    dbOk = true;
  } catch (err) {
    console.error(`❌ MongoDB Atlas Connection Failed: ${err.message}`);
    if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.error('   Hint: Atlas user credentials incorrect.');
    } else if (err.message.includes('querySrv') || err.message.includes('ENOTFOUND') || err.message.includes('timeout')) {
      console.error('   Hint: Network blocked or IP whitelist in MongoDB Atlas is missing 0.0.0.0/0.');
    }
  } finally {
    try {
      await mongoose.disconnect();
    } catch (_) {}
  }

  console.log('\n----------------------------------------------------');

  // 2. Check Cloudinary
  console.log('[2/2] Testing Cloudinary API Credentials...');
  console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`API Key   : ${process.env.CLOUDINARY_API_KEY}`);
  try {
    const pingResult = await cloudinary.api.ping();
    console.log(`✅ Cloudinary Ping Status: ${pingResult.status || 'OK'}`);

    const usageResult = await cloudinary.api.usage();
    console.log(`✅ Cloudinary Account Authenticated Successfully!`);
    console.log(`   Plan               : ${usageResult.plan || 'Free'}`);
    console.log(`   Transformations    : ${usageResult.transformations?.usage || 0} / ${usageResult.transformations?.credits_usage || 'unlimited'}`);
    console.log(`   Storage Used       : ${(usageResult.storage?.usage ? (usageResult.storage.usage / (1024 * 1024)).toFixed(2) : 0)} MB`);
    cloudinaryOk = true;
  } catch (err) {
    console.error(`❌ Cloudinary Verification Failed: ${err.message}`);
    if (err.http_code === 401) {
      console.error('   Hint: Invalid API Key or API Secret.');
    }
  }

  console.log('\n====================================================');
  console.log('                  Summary Report                     ');
  console.log('====================================================');
  console.log(`MongoDB Atlas : ${dbOk ? 'ONLINE ✅' : 'FAILED ❌'}`);
  console.log(`Cloudinary    : ${cloudinaryOk ? 'ONLINE ✅' : 'FAILED ❌'}`);
  console.log('====================================================\n');

  process.exit(dbOk && cloudinaryOk ? 0 : 1);
}

runDiagnostics();
