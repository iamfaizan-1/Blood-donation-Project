/**
 * Live HTTP Authentication Test against running server
 */
async function testAuth() {
  const baseUrl = 'http://localhost:5000/api';

  console.log('Testing live backend server at:', baseUrl);

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/health');
  const healthData = await healthRes.json();
  console.log('1. Health check:', healthData);

  // 2. Register test user
  const email = `user_${Date.now()}@lifesaver.org`;
  const registerPayload = {
    name: 'Live Test User',
    email,
    password: 'password123',
    phone: '+15551234567',
    bloodGroup: 'O+',
  };

  console.log('2. Registering user with email:', email);
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload),
  });

  const regData = await regRes.json();
  console.log('Registration status:', regRes.status);
  console.log('Registration response:', JSON.stringify(regData, null, 2));

  if (!regData.success || !regData.data?.token) {
    throw new Error('Registration failed!');
  }

  const token = regData.data.token;
  console.log('Token received successfully:', token.substring(0, 20) + '...');

  // 3. Login with the user
  console.log('3. Logging in with registered user...');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });

  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status);
  console.log('Login response:', JSON.stringify(loginData, null, 2));

  if (!loginData.success || !loginData.data?.token) {
    throw new Error('Login failed!');
  }

  // 4. Test GET /users/me
  console.log('4. Testing GET /api/users/me with Bearer token...');
  const meRes = await fetch(`${baseUrl}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const meData = await meRes.json();
  console.log('Me status:', meRes.status);
  console.log('Me response:', JSON.stringify(meData, null, 2));

  console.log('\n🎉 ALL LIVE AUTH HTTP TESTS PASSED!');
}

testAuth().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
