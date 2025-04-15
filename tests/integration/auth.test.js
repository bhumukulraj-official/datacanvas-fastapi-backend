const request = require('supertest');
const app = require('../../src/app');
const { ProfessionalAccount, AuthenticationToken } = require('../../src/db/models').models;
const { hashPassword } = require('../../src/utils/auth');
const { v4: uuidv4 } = require('uuid');

describe('Authentication API', () => {
  let testUser;
  let testRefreshToken;

  beforeAll(async () => {
    // Create test user
    const userId = uuidv4();
    const passwordHash = await hashPassword('Password123!');
    
    testUser = await ProfessionalAccount.create({
      accountId: userId,
      username: 'testuser',
      emailAddress: 'test@example.com',
      passwordHash,
      accountRole: 'user',
      isAccountActive: true
    });
  });

  afterAll(async () => {
    // Clean up test data
    await AuthenticationToken.destroy({ where: { accountId: testUser.accountId } });
    await testUser.destroy();
  });

  describe('POST /api/auth/login', () => {
    it('should log in successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Password123!'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('accountId', testUser.accountId);
      
      // Save refresh token for later tests
      testRefreshToken = res.body.refreshToken;
    });

    it('should fail with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should fail with missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should issue new tokens with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: testRefreshToken
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      
      // Update refresh token for later tests
      testRefreshToken = res.body.refreshToken;
    });

    it('should fail with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: 'invalid-token'
        });
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully log out with valid token', async () => {
      // First get a valid access token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Password123!'
        });
      
      const accessToken = loginRes.body.accessToken;
      const refreshToken = loginRes.body.refreshToken;
      
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });
}); 