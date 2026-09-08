import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { User } from '../src/models/User';

let mongoServer: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      launchTimeout: 30000,
    },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 35000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 35000);

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Authentication Endpoints', () => {
  const validUser = {
    email: 'user@mindos.me',
    password: 'SuperSecretPassword123!',
    name: 'Raihan Ahmed',
    preferredName: 'Raihan',
    languagePreference: 'banglish',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('user@mindos.me');
      expect(res.body.user.name).toBe('Raihan Ahmed');
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');

      // Verify stored in DB
      const dbUser = await User.findOne({ email: 'user@mindos.me' });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.refreshTokens.length).toBe(1);
    });

    it('should reject registration if email is already taken', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app).post('/api/auth/register').send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should fail validation if password is less than 8 characters', async () => {
      const res = await request(app).post('/api/auth/register').send({
        ...validUser,
        password: '123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: validUser.email,
        password: validUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: validUser.email,
        password: 'wrong-password',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });
  });

  describe('POST /api/auth/refresh & Token Rotation', () => {
    it('should issue new token pair and rotate old refresh token', async () => {
      const regRes = await request(app).post('/api/auth/register').send(validUser);
      const originalRefreshToken = regRes.body.tokens.refreshToken;

      const refreshRes = await request(app).post('/api/auth/refresh').send({
        refreshToken: originalRefreshToken,
      });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.tokens).toHaveProperty('accessToken');
      expect(refreshRes.body.tokens).toHaveProperty('refreshToken');
      expect(refreshRes.body.tokens.refreshToken).not.toBe(originalRefreshToken);

      // Attempting to reuse original rotated refresh token should fail
      const reuseRes = await request(app).post('/api/auth/refresh').send({
        refreshToken: originalRefreshToken,
      });
      expect(reuseRes.status).toBe(401);
    });
  });

  describe('GET /api/auth/me & Protected Access', () => {
    it('should return current user profile with valid Bearer token', async () => {
      const regRes = await request(app).post('/api/auth/register').send(validUser);
      const token = regRes.body.tokens.accessToken;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(validUser.email);
    });

    it('should return 401 Unauthorized without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should revoke the refresh token', async () => {
      const regRes = await request(app).post('/api/auth/register').send(validUser);
      const refreshToken = regRes.body.tokens.refreshToken;

      const logoutRes = await request(app).post('/api/auth/logout').send({
        refreshToken,
      });
      expect(logoutRes.status).toBe(200);

      // Refreshing after logout must fail
      const refreshRes = await request(app).post('/api/auth/refresh').send({
        refreshToken,
      });
      expect(refreshRes.status).toBe(401);
    });
  });
});
