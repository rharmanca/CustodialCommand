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

  console.log('Sending:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch('http://localhost:5000/api/inspections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);
    
    if (response.status === 500) {
      console.log('\n⚠️  Server error - check server logs for details');
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testSubmission();
import fetch from 'node-fetch';

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

  const res = await fetch('http://localhost:5000/api/inspections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}

testSubmission();
