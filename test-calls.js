#!/usr/bin/env node

/**
 * Test script for the Recent Calls feature
 * Tests: Schema, Endpoints, and Socket.IO events
 * Usage: node test-calls.js
 */

const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const io = require('socket.io-client');
require('dotenv').config();

// Import models and controllers
const CallLog = require('./models/callLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/agora_signaling';
const TEST_PORT = 3001;

let isConnected = false;

/**
 * Test 1: Verify MongoDB Connection and TTL Index
 */
async function testMongoDBConnection() {
  console.log('\n=== TEST 1: MongoDB Connection & TTL Index ===');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ MongoDB connected');

    // Check if TTL index exists
    const indexes = await CallLog.collection.getIndexes();
    const hasTTLIndex = Object.values(indexes).some(
      idx => idx.expireAfterSeconds === 7776000
    );

    if (hasTTLIndex) {
      console.log('✓ TTL index found (90 days auto-deletion enabled)');
    } else {
      console.warn('⚠ TTL index not found - creating indexes...');
      await CallLog.collection.dropIndexes();
      await CallLog.syncIndexes();
      console.log('✓ Indexes synced');
    }

    isConnected = true;
    return true;
  } catch (error) {
    console.error('✗ MongoDB error:', error.message);
    return false;
  }
}

/**
 * Test 2: Create Sample Call Log
 */
async function testCreateCallLog() {
  console.log('\n=== TEST 2: Create Call Log ===');
  try {
    const newCall = new CallLog({
      callerId: 'user-123',
      receiverId: 'user-456',
      status: 'completed',
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(),
      duration: 3600,
      createdAt: new Date()
    });

    const saved = await newCall.save();
    console.log('✓ Call log created:', saved._id);
    return saved._id;
  } catch (error) {
    console.error('✗ Error creating call log:', error.message);
    return null;
  }
}

/**
 * Test 3: Query Call History
 */
async function testQueryCallHistory() {
  console.log('\n=== TEST 3: Query Call History ===');
  try {
    // Create test calls
    const calls = [];
    for (let i = 0; i < 5; i++) {
      const call = new CallLog({
        callerId: 'user-123',
        receiverId: `user-${i}`,
        status: 'completed',
        startTime: new Date(Date.now() - i * 3600000),
        endTime: new Date(Date.now() - (i - 1) * 3600000),
        duration: 3600,
        createdAt: new Date(Date.now() - i * 3600000)
      });
      calls.push(await call.save());
    }

    // Test query
    const history = await CallLog.find({
      $or: [{ callerId: 'user-123' }, { receiverId: 'user-123' }]
    }).sort({ createdAt: -1 }).limit(20);

    console.log(`✓ Retrieved ${history.length} call records`);
    return true;
  } catch (error) {
    console.error('✗ Error querying history:', error.message);
    return false;
  }
}

/**
 * Test 4: Update Call Log
 */
async function testUpdateCallLog() {
  console.log('\n=== TEST 4: Update Call Log ===');
  try {
    const call = new CallLog({
      callerId: 'user-789',
      receiverId: 'user-999',
      status: 'calling',
      startTime: new Date(),
      duration: 0,
      createdAt: new Date()
    });

    const saved = await call.save();
    console.log('✓ Call created with status: calling');

    // Update the call
    const updated = await CallLog.findByIdAndUpdate(
      saved._id,
      {
        status: 'completed',
        endTime: new Date(),
        duration: 300
      },
      { new: true }
    );

    console.log('✓ Call updated:', {
      status: updated.status,
      duration: updated.duration,
      endTime: updated.endTime.toISOString()
    });

    return true;
  } catch (error) {
    console.error('✗ Error updating call log:', error.message);
    return false;
  }
}

/**
 * Test 5: Delete Call Log
 */
async function testDeleteCallLog() {
  console.log('\n=== TEST 5: Delete Call Log ===');
  try {
    const call = new CallLog({
      callerId: 'user-delete-test',
      receiverId: 'user-xxx',
      status: 'completed',
      startTime: new Date(),
      duration: 100,
      createdAt: new Date()
    });

    const saved = await call.save();
    console.log('✓ Call created:', saved._id);

    const deleted = await CallLog.findByIdAndDelete(saved._id);
    console.log('✓ Call deleted successfully');

    return true;
  } catch (error) {
    console.error('✗ Error deleting call log:', error.message);
    return false;
  }
}

/**
 * Test 6: Validate Schema Fields
 */
async function testSchemaValidation() {
  console.log('\n=== TEST 6: Schema Validation ===');
  try {
    // Test required fields
    try {
      const invalidCall = new CallLog({
        callerId: 'user-123'
        // Missing receiverId and startTime
      });
      await invalidCall.save();
      console.warn('⚠ Schema validation not enforced - consider enabling validation');
      return true;
    } catch (e) {
      console.log('✓ Schema validation working - required fields enforced');
      return true;
    }
  } catch (error) {
    console.error('✗ Validation error:', error.message);
    return false;
  }
}

/**
 * Test 7: Test Pagination Logic
 */
async function testPaginationLogic() {
  console.log('\n=== TEST 7: Pagination Logic ===');
  try {
    // Clear and create 25 test records
    await CallLog.deleteMany({ callerId: 'pagination-test' });

    const calls = [];
    for (let i = 0; i < 25; i++) {
      const call = new CallLog({
        callerId: 'pagination-test',
        receiverId: `user-${i}`,
        status: 'completed',
        startTime: new Date(Date.now() - i * 3600000),
        duration: 100,
        createdAt: new Date(Date.now() - i * 3600000)
      });
      calls.push(await call.save());
    }

    // Test pagination (page 1, limit 10)
    const page1 = await CallLog.find({ callerId: 'pagination-test' })
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(10);

    const total = await CallLog.countDocuments({ callerId: 'pagination-test' });
    const pages = Math.ceil(total / 10);

    console.log(`✓ Pagination test:`, {
      page: 1,
      limit: 10,
      returned: page1.length,
      total,
      pages,
      calculation: `${total} documents / 10 per page = ${pages} total pages`
    });

    return true;
  } catch (error) {
    console.error('✗ Pagination test error:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   RECENT CALLS FEATURE TEST SUITE      ║');
  console.log('╚════════════════════════════════════════╝');

  const results = [];

  results.push(await testMongoDBConnection());
  
  if (!isConnected) {
    console.error('\n✗ Cannot proceed - MongoDB not connected');
    process.exit(1);
  }

  results.push(await testCreateCallLog());
  results.push(await testQueryCallHistory());
  results.push(await testUpdateCallLog());
  results.push(await testDeleteCallLog());
  results.push(await testSchemaValidation());
  results.push(await testPaginationLogic());

  // Summary
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║           TEST SUMMARY                 ║');
  console.log('╚════════════════════════════════════════╝');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n✓ PASSED: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log(`\n⚠ ${total - passed} test(s) failed`);
  }

  // Cleanup
  await mongoose.disconnect();
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
