import fetch from 'node-fetch';

async function testSubmission() {
  const testData = {
    date: new Date().toISOString(),
    time: "09:00",
    location: "Test Location",
    inspector: "Test Inspector",
    area: "Test Area",
    score: 85,
    notes: "Test submission",
    categories: []
  };

  try {
    console.log('Sending test submission...');
    const response = await fetch('http://localhost:5000/api/inspections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', text);
    
    if (!response.ok) {
      console.error('Server error:', text);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testSubmission();
