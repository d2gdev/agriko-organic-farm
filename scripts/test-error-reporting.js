// Test script to verify error reporting endpoint
const testErrorReporting = async () => {
  const errorData = {
    message: 'Test error from integration testing',
    stack: 'Error: Test error\n  at testFunction (test.js:10:15)\n  at main (test.js:20:5)',
    componentStack: 'in TestComponent\n  in ErrorBoundary\n  in App',
    url: 'http://localhost:3000/test',
    userAgent: 'Mozilla/5.0 Test Browser',
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch('http://localhost:3000/api/errors/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Error reporting successful:', result);
    } else {
      console.error('❌ Error reporting failed:', result);
    }
  } catch (error) {
    console.error('❌ Failed to send error report:', error.message);
  }
};

// Run the test
testErrorReporting();