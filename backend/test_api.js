const axios = require('axios');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
    console.log('\n\x1b[36m%s\x1b[0m', '==================================================');
    console.log('\x1b[36m%s\x1b[0m', '     LUXESTATES AUTOMATED API INTEGRATION TESTS  ');
    console.log('\x1b[36m%s\x1b[0m', '==================================================\n');

    let passedCount = 0;
    let failedCount = 0;
    let token = null;

    async function test(name, fn) {
        try {
            await fn();
            console.log(`\x1b[32m[PASS]\x1b[0m ${name}`);
            passedCount++;
        } catch (error) {
            console.log(`\x1b[31m[FAIL]\x1b[0m ${name}`);
            if (error.response) {
                console.error(`       ↳ Reason: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else {
                console.error(`       ↳ Reason: ${error.message}`);
            }
            failedCount++;
        }
    }

    const testEmail = `test_${Date.now()}@gmail.com`;
    const testPassword = 'Password123';
    let testUserId = null;

    try {
        // 1. TC_AUTH_01: Register user
        await test('TC_AUTH_01: Register a new member account', async () => {
            const res = await axios.post(`${BASE_URL}/auth/register`, {
                email: testEmail,
                password: testPassword,
                full_name: 'Test Automation User',
                phone: '0900000001'
            });
            if (res.status !== 201) throw new Error(`Registration failed with status ${res.status}`);
            
            // Get user_id from DB
            const [users] = await pool.query('SELECT user_id FROM users WHERE email = ?', [testEmail]);
            if (users.length === 0) throw new Error('User not found in database after registration');
            testUserId = users[0].user_id;
        });

        // 2. TC_AUTH_02: Register duplicate email
        await test('TC_AUTH_02: Register duplicate email blocks registration', async () => {
            try {
                await axios.post(`${BASE_URL}/auth/register`, {
                    email: testEmail,
                    password: testPassword,
                    full_name: 'Duplicate User',
                    phone: '0900000002'
                });
                throw new Error('Registration should have failed due to duplicate email');
            } catch (error) {
                if (!error.response || error.response.status !== 400) {
                    throw new Error(`Expected 400 Bad Request, got ${error.response ? error.response.status : error.message}`);
                }
            }
        });

        // 3. TC_AUTH_03: Login fails before verifying OTP
        await test('TC_AUTH_03: Login fails for unverified email account', async () => {
            try {
                await axios.post(`${BASE_URL}/auth/login`, {
                    email: testEmail,
                    password: testPassword
                });
                throw new Error('Login should have failed due to unverified email');
            } catch (error) {
                if (!error.response || error.response.status !== 403) {
                    throw new Error(`Expected 403 Forbidden, got ${error.response ? error.response.status : error.message}`);
                }
            }
        });

        // 4. TC_AUTH_04: Verify OTP code
        await test('TC_AUTH_04: Verify registration email using OTP token', async () => {
            // Retrieve OTP token from database
            const [tokens] = await pool.query(
                'SELECT token FROM otp_tokens WHERE user_id = ? AND purpose = "email_verify" AND is_used = FALSE ORDER BY created_at DESC LIMIT 1',
                [testUserId]
            );
            if (tokens.length === 0) throw new Error('No OTP token found for registered user in database');
            const otpCode = tokens[0].token;

            const res = await axios.post(`${BASE_URL}/auth/verify-otp`, {
                email: testEmail,
                token: otpCode
            });
            if (res.status !== 200) throw new Error(`OTP verification failed with status ${res.status}`);
        });

        // 5. TC_AUTH_05: Login successfully after verification
        await test('TC_AUTH_05: Login with correct credentials returns jwt cookie', async () => {
            const res = await axios.post(`${BASE_URL}/auth/login`, {
                email: testEmail,
                password: testPassword
            });
            if (res.status !== 200) throw new Error(`Login failed with status ${res.status}`);
            
            const setCookieHeader = res.headers['set-cookie'];
            if (!setCookieHeader) throw new Error('No set-cookie header returned on login');
            
            const jwtCookie = setCookieHeader.find(c => c.startsWith('jwt='));
            if (!jwtCookie) throw new Error('jwt cookie missing in response headers');
            
            token = jwtCookie.split(';')[0].split('=')[1];
            if (!token) throw new Error('Failed to parse jwt token value');
        });

        // 6. TC_AUTH_06: Login with incorrect password
        await test('TC_AUTH_06: Login with incorrect password returns 400 Bad Request', async () => {
            try {
                await axios.post(`${BASE_URL}/auth/login`, {
                    email: testEmail,
                    password: 'IncorrectPassword'
                });
                throw new Error('Login should have failed due to incorrect password');
            } catch (error) {
                if (!error.response || error.response.status !== 400) {
                    throw new Error(`Expected 400 Bad Request, got ${error.response ? error.response.status : error.message}`);
                }
            }
        });

        // Protected routes testing
        if (token) {
            const headers = { Cookie: `jwt=${token}` };

            // 7. TC_GEO_01: Geocode Address
            await test('TC_GEO_01: Forward Geocoding proxy address search', async () => {
                const res = await axios.get(`${BASE_URL}/properties/geocode?q=landmark+81`, { headers });
                if (res.status !== 200) throw new Error(`Geocoding request failed with status ${res.status}`);
                if (!Array.isArray(res.data)) throw new Error('Expected results to be an array');
            });

            // 8. TC_GEO_02: Reverse Geocode Coordinates
            await test('TC_GEO_02: Reverse Geocoding latitude/longitude coordinates', async () => {
                const res = await axios.get(`${BASE_URL}/properties/reverse-geocode?lat=10.7948&lng=106.6261`, { headers });
                if (res.status !== 200) throw new Error(`Reverse geocoding request failed with status ${res.status}`);
                if (!res.data.display_name) throw new Error('Expected reverse geocoding result to contain display_name');
            });
        } else {
            console.log('\n\x1b[33m[WARN] Skipping protected route tests (TC_GEO_*) because login token is unavailable.\x1b[0m');
        }

    } finally {
        // Clean up test database data (Teardown)
        if (testUserId) {
            await pool.query('DELETE FROM users WHERE user_id = ?', [testUserId]);
            console.log('\n\x1b[33m[CLEANUP] Deleted test user account from database.\x1b[0m');
        }
        await pool.end(); // close mysql connection pool
    }

    console.log('\n\x1b[36m%s\x1b[0m', '--------------------------------------------------');
    console.log(`TEST SUMMARY: Passed: \x1b[32m${passedCount}\x1b[0m, Failed: \x1b[31m${failedCount}\x1b[0m`);
    console.log('\x1b[36m%s\x1b[0m', '==================================================\n');
}

runTests();
