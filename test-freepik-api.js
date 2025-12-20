/**
 * Test script to verify Freepik API key and video generation
 */
const https = require('https');
const fs = require('fs');

// Read .env file manually
let API_KEY;
try {
  const envContent = fs.readFileSync(__dirname + '/.env', 'utf8');
  const match = envContent.match(/FREEPIK_API_KEY=(.+)/);
  if (match) {
    API_KEY = match[1].trim().replace(/["']/g, '');
  }
} catch (e) {
  // Try backend .env
  try {
    const envContent = fs.readFileSync(__dirname + '/backend/.env', 'utf8');
    const match = envContent.match(/FREEPIK_API_KEY=(.+)/);
    if (match) {
      API_KEY = match[1].trim().replace(/["']/g, '');
    }
  } catch (e2) {
    console.error('Could not read .env file');
  }
}
const VIDEO_API_URL = 'https://api.freepik.com/v1/ai/image-to-video/kling-v2-5-pro';

// Test image URL (a simple, clear image from a public source)
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=1024&h=1024&fit=crop';

async function testFreepikAPI() {
  console.log('🧪 Testing Freepik API Configuration\n');
  console.log('=' .repeat(60));
  
  // Step 1: Check API key
  console.log('\n📋 Step 1: API Key Validation');
  console.log('-'.repeat(60));
  
  if (!API_KEY) {
    console.error('❌ FREEPIK_API_KEY is not set in .env file');
    process.exit(1);
  }
  
  console.log('✅ API Key found:', `${API_KEY.substring(0, 15)}...${API_KEY.substring(API_KEY.length - 5)}`);
  console.log('   Length:', API_KEY.length, 'characters');
  
  // Check for common issues
  if (API_KEY.includes('"') || API_KEY.includes("'")) {
    console.error('⚠️  WARNING: API key contains quotes! Remove them from .env file');
  }
  
  if (API_KEY.length < 30) {
    console.error('⚠️  WARNING: API key seems too short');
  }
  
  // Step 2: Test image-to-video endpoint
  console.log('\n📋 Step 2: Testing Video Generation API');
  console.log('-'.repeat(60));
  console.log('Using test image:', TEST_IMAGE_URL);
  console.log('API endpoint:', VIDEO_API_URL);
  
  const requestPayload = {
    image: TEST_IMAGE_URL,
    prompt: 'gentle movement',
    duration: '5',
    cfg_scale: 0.5
  };
  
  console.log('\n📤 Sending request...');
  console.log('Payload:', JSON.stringify(requestPayload, null, 2));
  
  try {
    const data = JSON.stringify(requestPayload);
    const url = new URL(VIDEO_API_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'x-freepik-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, statusMessage: res.statusMessage, headers: res.headers, body });
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
    
    console.log('\n📥 Response received:');
    console.log('   Status:', response.statusCode, response.statusMessage);
    console.log('   Headers:', response.headers);
    
    console.log('\n📄 Response body:');
    
    let responseData;
    try {
      responseData = JSON.parse(response.body);
      console.log(JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log(response.body);
    }
    
    if (response.statusCode >= 400) {
      console.error('\n❌ API request failed!');
      console.error('   Status:', response.statusCode);
      
      if (response.statusCode === 401) {
        console.error('\n💡 Solution: Your API key is invalid or not authorized');
        console.error('   → Go to: https://www.freepik.com/api/dashboard');
        console.error('   → Verify your API key');
        console.error('   → Ensure your plan includes Kling video generation');
      } else if (response.statusCode === 402) {
        console.error('\n💡 Solution: Out of credits or quota exceeded');
        console.error('   → Go to: https://www.freepik.com/api/dashboard');
        console.error('   → Check your usage and billing');
      } else if (response.statusCode === 429) {
        console.error('\n💡 Solution: Rate limit exceeded');
        console.error('   → Wait a moment and try again');
      } else if (response.statusCode === 400) {
        console.error('\n💡 Solution: Bad request - check payload format');
        console.error('   → Image URL must be publicly accessible');
        console.error('   → Check required parameters');
      }
      
      process.exit(1);
    }
    
    console.log('\n✅ API request successful!');
    
    if (responseData && responseData.data && responseData.data.task_id) {
      const taskId = responseData.data.task_id;
      console.log('\n🎬 Video generation started!');
      console.log('   Task ID:', taskId);
      console.log('\n📋 Polling for status (this may take 1-2 minutes)...');
      
      // Poll for result
      let attempts = 0;
      const maxAttempts = 60;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        
        const statusUrl = `${VIDEO_API_URL}/${taskId}`;
        const url2 = new URL(statusUrl);
        const statusOptions = {
          hostname: url2.hostname,
          port: 443,
          path: url2.pathname,
          method: 'GET',
          headers: {
            'x-freepik-api-key': API_KEY
          }
        };
        
        const statusResp = await new Promise((resolve, reject) => {
          const req = https.request(statusOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => { resolve({ body }); });
          });
          req.on('error', reject);
          req.end();
        });
        
        const statusData = JSON.parse(statusResp.body);
        const status = statusData.data ? statusData.data.status : statusData.status;
        
        console.log(`   [${attempts}/${maxAttempts}] Status: ${status}`);
        
        if (status === 'COMPLETED') {
          console.log('\n✅ Video generation completed!');
          console.log('   Video URL:', statusData.data.generated?.[0] || statusData.data.video_url || 'Not found in response');
          console.log('\n🎉 SUCCESS! Your Freepik API is working correctly!');
          process.exit(0);
        } else if (status === 'FAILED') {
          console.error('\n❌ Video generation failed!');
          console.error('   Full response:', JSON.stringify(statusData, null, 2));
          console.error('\n💡 Common causes:');
          console.error('   → Image quality issues');
          console.error('   → Content policy violation');
          console.error('   → API quota/credits exhausted');
          console.error('   → Image URL not accessible');
          console.error('\n🔍 Check your Freepik dashboard: https://www.freepik.com/api/dashboard');
          process.exit(1);
        }
      }
      
      console.error('\n⏰ Timeout: Video generation took too long');
      console.error('   Task ID:', taskId);
      console.error('   Check status later at: https://www.freepik.com/api/dashboard');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error during API test:');
    console.error(error);
    process.exit(1);
  }
}

console.log('\n🚀 Freepik API Test Tool');
console.log('   This tool will verify your API key and test video generation\n');

testFreepikAPI().catch(err => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
