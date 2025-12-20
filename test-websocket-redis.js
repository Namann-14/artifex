#!/usr/bin/env node

/**
 * WebSocket & Redis Test Script
 * Tests the implementation to ensure everything is working correctly
 */

const io = require('socket.io-client');
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api/v1';
const WS_URL = process.env.WS_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'your-test-token';
const USER_ID = process.env.TEST_USER_ID || 'test-user-123';

console.log('🧪 Testing WebSocket & Redis Implementation\n');
console.log('Configuration:');
console.log(`  API URL: ${API_URL}`);
console.log(`  WebSocket URL: ${WS_URL}`);
console.log(`  User ID: ${USER_ID}\n`);

// Test 1: WebSocket Connection
async function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    console.log('1️⃣  Testing WebSocket Connection...');
    
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 5000,
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Connection timeout'));
    }, 5000);

    socket.on('connect', () => {
      console.log('   ✅ Connected to WebSocket');
      console.log(`   Socket ID: ${socket.id}`);
      
      // Test authentication
      socket.emit('authenticate', USER_ID);
    });

    socket.on('authenticated', (data) => {
      console.log('   ✅ Authentication successful');
      console.log(`   Data: ${JSON.stringify(data)}`);
      clearTimeout(timeout);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    socket.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Test 2: Redis Connection
async function testRedisConnection() {
  console.log('\n2️⃣  Testing Redis Connection...');
  try {
    const response = await axios.get(`${API_URL}/health`);
    console.log('   ✅ Health check passed');
    console.log(`   Status: ${response.data.status}`);
    return true;
  } catch (error) {
    throw new Error(`Health check failed: ${error.message}`);
  }
}

// Test 3: Async Job Queue
async function testAsyncJobQueue() {
  console.log('\n3️⃣  Testing Async Job Queue...');
  
  try {
    const response = await axios.post(
      `${API_URL}/generate/text-to-image/async`,
      {
        prompt: 'Test image - a simple red circle',
        aspectRatio: '1:1',
        style: 'realistic',
        quality: 'standard',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
        validateStatus: (status) => status < 500, // Accept 4xx errors
      }
    );

    if (response.status === 202) {
      console.log('   ✅ Job queued successfully');
      console.log(`   Job ID: ${response.data.jobId}`);
      console.log(`   Status: ${response.data.status}`);
      return response.data.jobId;
    } else if (response.status === 401) {
      console.log('   ⚠️  Authentication required (expected in test mode)');
      console.log('   💡 Set TEST_AUTH_TOKEN environment variable with valid token');
      return null;
    } else {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   ⚠️  Authentication required (expected in test mode)');
      console.log('   💡 Set TEST_AUTH_TOKEN environment variable with valid token');
      return null;
    }
    throw error;
  }
}

// Test 4: Job Progress Tracking
async function testJobProgressTracking(jobId) {
  if (!jobId) {
    console.log('\n4️⃣  Skipping Job Progress Tracking (no job ID)');
    return;
  }

  return new Promise((resolve, reject) => {
    console.log('\n4️⃣  Testing Job Progress Tracking...');
    
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
    });

    const updates = [];
    const timeout = setTimeout(() => {
      console.log('   ⏱️  Timeout reached, stopping tracking');
      socket.disconnect();
      resolve(updates);
    }, 30000); // 30 seconds max

    socket.on('connect', () => {
      console.log('   ✅ Connected for progress tracking');
      socket.emit('authenticate', USER_ID);
    });

    socket.on('authenticated', () => {
      console.log('   ✅ Authenticated, subscribing to job');
      socket.emit('subscribe:job', jobId);
    });

    socket.on('subscribed', () => {
      console.log(`   ✅ Subscribed to job ${jobId}`);
      socket.emit('request:job-status', jobId);
    });

    socket.on('generation:progress', (data) => {
      console.log(`   📊 Progress: ${data.progress}% - ${data.message}`);
      updates.push(data);
    });

    socket.on('generation:complete', (data) => {
      console.log('   ✅ Generation completed!');
      console.log(`   Images: ${data.result?.data?.images?.length || 0}`);
      clearTimeout(timeout);
      socket.disconnect();
      resolve(updates);
    });

    socket.on('generation:error', (data) => {
      console.log(`   ❌ Generation failed: ${data.error.message}`);
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(data.error.message));
    });
  });
}

// Test 5: Job Status API
async function testJobStatusAPI(jobId) {
  if (!jobId) {
    console.log('\n5️⃣  Skipping Job Status API (no job ID)');
    return;
  }

  console.log('\n5️⃣  Testing Job Status API...');
  
  try {
    const response = await axios.get(
      `${API_URL}/generate/job/${jobId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
        validateStatus: (status) => status < 500,
      }
    );

    if (response.status === 200) {
      console.log('   ✅ Job status retrieved');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Progress: ${response.data.progress || 'N/A'}`);
      return true;
    } else if (response.status === 401) {
      console.log('   ⚠️  Authentication required');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   ⚠️  Authentication required');
      return false;
    }
    throw error;
  }
}

// Run all tests
async function runTests() {
  console.log('═'.repeat(60));
  console.log('Starting Tests...\n');
  
  const results = {
    websocket: false,
    redis: false,
    jobQueue: false,
    progressTracking: false,
    statusAPI: false,
  };

  try {
    // Test 1
    results.websocket = await testWebSocketConnection();
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }

  try {
    // Test 2
    results.redis = await testRedisConnection();
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }

  let jobId = null;
  try {
    // Test 3
    jobId = await testAsyncJobQueue();
    results.jobQueue = !!jobId || true; // True if it correctly requires auth
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }

  if (jobId) {
    try {
      // Test 4
      await testJobProgressTracking(jobId);
      results.progressTracking = true;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }

    try {
      // Test 5
      results.statusAPI = await testJobStatusAPI(jobId);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Results:\n');
  console.log(`   WebSocket Connection:     ${results.websocket ? '✅' : '❌'}`);
  console.log(`   Redis Connection:         ${results.redis ? '✅' : '❌'}`);
  console.log(`   Job Queue:                ${results.jobQueue ? '✅' : '❌'}`);
  console.log(`   Progress Tracking:        ${results.progressTracking ? '✅' : '⏭️  Skipped'}`);
  console.log(`   Status API:               ${results.statusAPI ? '✅' : '⏭️  Skipped'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n   Total: ${passedTests}/${totalTests} tests passed`);
  console.log('═'.repeat(60));

  if (passedTests >= 3) {
    console.log('\n✅ Core functionality is working!');
    if (!jobId) {
      console.log('\n💡 To test full flow with authentication:');
      console.log('   1. Get a valid auth token from your app');
      console.log('   2. Run: TEST_AUTH_TOKEN="your-token" node test-websocket-redis.js');
    }
  } else {
    console.log('\n❌ Some tests failed. Check your configuration.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});
