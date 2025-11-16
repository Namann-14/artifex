const fetch = require('node-fetch');

const FREEPIK_API_KEY = 'FPSXab36cff5d584740396e90fb3be1d8e45';
const FREEPIK_API_URL = 'https://api.freepik.com/v1/ai/mystic';

async function testFreepikAPI() {
  console.log('Testing Freepik API...');
  console.log('API Key:', FREEPIK_API_KEY);
  console.log('API URL:', FREEPIK_API_URL);
  
  const payload = {
    prompt: 'a beautiful sunset over mountains',
    resolution: '1k',
    aspect_ratio: 'square_1_1',
    model: 'realism',
    creative_detailing: 25,
    hdr: 30,
    engine: 'automatic',
    fixed_generation: false,
    filter_nsfw: true
  };

  console.log('\nRequest payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(FREEPIK_API_URL, {
      method: 'POST',
      headers: {
        'x-freepik-api-key': FREEPIK_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('\nResponse status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('\nResponse body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('\nParsed response:', JSON.stringify(data, null, 2));
      
      if (data.image_url) {
        console.log('\n✅ Success! Image URL:', data.image_url);
      } else if (data.id || data.generation_id) {
        console.log('\n⏳ Generation started. ID:', data.id || data.generation_id);
        console.log('You need to poll for the result.');
      } else {
        console.log('\n⚠️ Unexpected response format');
      }
    } else {
      console.log('\n❌ API request failed');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Error response (not JSON):', responseText);
      }
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
}

testFreepikAPI();
