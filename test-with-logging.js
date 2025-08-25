async function testSubmission() {
  const testData = {
    date: new Date().toISOString().slice(0,10),
    time: "09:00",
    location: "Test Location",
    inspector: "Test Inspector",
    area: "Test Area",
    score: 85,
    notes: "Test submission",
    school: "Test School",
    inspectionType: "whole_building",
    locationDescription: "Test building",
    categories: []
  };

  console.log('Sending:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:5000/api/inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);

    if (response.status >= 400) {
      console.log('\n⚠️  Request failed - check server logs below');
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testSubmission();
async function testSubmission() {
  const testData = {
    date: new Date().toISOString().slice(0,10),
    time: "09:00",
    location: "Test Location",
    inspector: "Test Inspector",
    area: "Test Area",
    score: 85,
    notes: "Test submission",
    school: "Test School",
    inspectionType: "whole_building",
    locationDescription: "Test building",
    categories: []
  };

  console.log('Sending:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:5000/api/inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);

    if (response.status >= 400) {
      console.log('\nRequest failed - check server logs.');
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testSubmission();
