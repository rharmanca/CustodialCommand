import fetch from 'node-fetch';

async function testSubmission() {
  // Test with minimal required fields only
  const testData = {
    date: new Date().toISOString(),
    time: "09:00",
    location: "Test Location",
    inspector: "Test Inspector",
    area: "Test Area",
    score: 85,
    notes: "Test submission without optional fields",
    categories: []
    // NOT including school, inspectionType, or locationDescription
  };

  try {
    console.log('Testing submission with minimal fields...');
    const response = await fetch('http://localhost:5000/api/inspections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const text = await response.text();
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ SUCCESS! Submission works without optional fields');
      console.log('Response:', text);
    } else {
      console.log('❌ Still failing:', text);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testSubmission();
