const fetch = require('node-fetch');

// Test video generation with Freepik API
async function testVideoGeneration() {
  const apiKey = 'FPSX79814dd93a7a776404ef5441cd4d129e';
  const videoApiUrl = 'https://api.freepik.com/v1/ai/image-to-video/kling-v2-5-pro';
  
  // Test with a simple public image URL
  // const testImageUrl = 'https://res.cloudinary.com/naman14/image/upload/v1763299690/artifex/video-sources/huqki2hiaar6adli15o0.jpg';
  
  // Try with a different well-known test image
  const testImageUrl = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba';
  
  const requestBody = {
    image: testImageUrl,
    prompt: 'A cat walking gracefully',
    duration: '5',
    cfg_scale: 0.5
  };
  
  console.log('Testing video generation with Freepik API...');
  console.log('Request payload:', JSON.stringify(requestBody, null, 2));
  
  try {
    // Initiate video generation
    const response = await fetch(videoApiUrl, {
      method: 'POST',
      headers: {
        'x-freepik-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('\n=== INITIATION RESPONSE ===');
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('ERROR: API request failed');
      return;
    }
    
    const taskId = data.data.task_id;
    console.log('\n✓ Task created:', taskId);
    console.log('Now polling for completion...\n');
    
    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60;
    const pollInterval = 5000;
    
    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      const statusUrl = `${videoApiUrl}/${taskId}`;
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'x-freepik-api-key': apiKey
        }
      });
      
      const statusData = await statusResponse.json();
      console.log(`Attempt ${attempts}/${maxAttempts} - Status: ${statusData.data.status}`);
      
      if (statusData.data.status === 'COMPLETED') {
        console.log('\n=== SUCCESS! ===');
        console.log('Video URL:', statusData.data.generated[0]);
        console.log('Full response:', JSON.stringify(statusData, null, 2));
        break;
      } else if (statusData.data.status === 'FAILED') {
        console.log('\n=== FAILED ===');
        console.log('Full error response:', JSON.stringify(statusData, null, 2));
        break;
      }
    }
    
    if (attempts >= maxAttempts) {
      console.log('\n=== TIMEOUT ===');
      console.log('Video generation timed out after', maxAttempts * pollInterval / 1000, 'seconds');
    }
    
  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error(error);
  }
}

testVideoGeneration();
