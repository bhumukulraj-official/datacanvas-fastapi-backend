const request = require('supertest');
const app = require('../../src/app');

describe('Security Headers', () => {
  it('should include security headers', async () => {
    const res = await request(app).get('/');
    
    // Content Type Options
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    
    // XSS Protection
    expect(res.headers['x-xss-protection']).toBeTruthy();
    
    // Frame Options
    expect(res.headers['x-frame-options']).toBe('DENY');
    
    // Referrer Policy
    expect(res.headers['referrer-policy']).toBe('same-origin');
  });
});

describe('Rate Limiting', () => {
  it('should rate limit login endpoint', async () => {
    // Make multiple login requests to trigger rate limiting
    const requests = [];
    for (let i = 0; i < 15; i++) {
      requests.push(
        request(app)
          .post('/api/auth/login')
          .send({ username: 'test', password: 'test' })
      );
    }
    
    const responses = await Promise.all(requests);
    
    // At least one response should be rate limited (429)
    const rateLimited = responses.some(res => res.status === 429);
    expect(rateLimited).toBe(true);
  });
});

describe('Input Validation', () => {
  it('should reject invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/request-password-recovery')
      .send({ email: 'not-an-email' });
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

describe('CORS', () => {
  it('should include CORS headers', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'http://example.com');
    
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
}); 