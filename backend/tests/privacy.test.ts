import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Memory } from '../src/models/Memory';
import { Checkin } from '../src/models/Checkin';
import { Journal } from '../src/models/Journal';
import { SupportProfile } from '../src/models/SupportProfile';

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
  await Memory.deleteMany({});
  await Checkin.deleteMany({});
  await Journal.deleteMany({});
  await SupportProfile.deleteMany({});
});

describe('Phase 12: User-Controlled AI Memory & Privacy Controls', () => {
  const registerUser = async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'privacy_user@mindos.me',
      password: 'Password123!',
      name: 'Anika Tabassum',
      preferredName: 'Anika',
    });
    return { token: res.body.tokens.accessToken, user: res.body.user };
  };

  describe('AI Memory Inspection & Management', () => {
    it('rejects unauthenticated requests to /api/privacy/memories with 401', async () => {
      const res = await request(app).get('/api/privacy/memories');
      expect(res.status).toBe(401);
    });

    it('seeds and returns transparent starter memories for new user', async () => {
      const { token } = await registerUser();

      const res = await request(app)
        .get('/api/privacy/memories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.aiMemoryEnabled).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.memories[0]).toHaveProperty('type');
      expect(res.body.memories[0]).toHaveProperty('content');
    });

    it('allows user to manually store a personal context memory', async () => {
      const { token } = await registerUser();

      const res = await request(app)
        .post('/api/privacy/memories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'user_context',
          content: 'Preparing for BCS examinations in Dhaka, usually studies late evenings.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.memory.content).toContain('BCS examinations');
      expect(res.body.memory.type).toBe('user_context');
    });

    it('allows user to forget and delete an individual memory', async () => {
      const { token } = await registerUser();

      const addRes = await request(app)
        .post('/api/privacy/memories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'preference',
          content: 'Prefers quiet reflection over audio breathing.',
        });

      const memoryId = addRes.body.memory._id;

      const deleteRes = await request(app)
        .delete(`/api/privacy/memories/${memoryId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.message).toContain('MindOS forgot this memory');

      const checkRes = await request(app)
        .get('/api/privacy/memories')
        .set('Authorization', `Bearer ${token}`);

      const found = checkRes.body.memories.find((m: any) => m._id === memoryId);
      expect(found).toBeUndefined();
    });

    it('toggles AI memory retention on and off', async () => {
      const { token } = await registerUser();

      // Pause memory
      const pauseRes = await request(app)
        .put('/api/privacy/toggle-memory')
        .set('Authorization', `Bearer ${token}`)
        .send({ enabled: false });

      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.aiMemoryEnabled).toBe(false);

      // Attempting to add memory when paused should fail
      const tryAddRes = await request(app)
        .post('/api/privacy/memories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'routine',
          content: 'Should fail because memory is paused.',
        });

      expect(tryAddRes.status).toBe(400);
      expect(tryAddRes.body.message).toContain('paused');

      // Re-enable memory
      const resumeRes = await request(app)
        .put('/api/privacy/toggle-memory')
        .set('Authorization', `Bearer ${token}`)
        .send({ enabled: true });

      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.aiMemoryEnabled).toBe(true);
    });
  });

  describe('Data Export & Account Deletion', () => {
    it('exports complete user data package without sensitive password hashes', async () => {
      const { token, user } = await registerUser();
      const userId = user.id || user._id;

      await Checkin.create({
        userId,
        mood: 'neutral',
        energyLevel: 3,
        tags: ['routine'],
        date: '2026-09-08',
      });

      await Journal.create({
        userId,
        content: 'Personal private thoughts about my day.',
        aiReflection: { text: 'A reflective response.' },
      });

      const exportRes = await request(app)
        .get('/api/privacy/export')
        .set('Authorization', `Bearer ${token}`);

      expect(exportRes.status).toBe(200);
      expect(exportRes.body.success).toBe(true);
      expect(exportRes.body.export).toHaveProperty('exportedAt');
      expect(exportRes.body.export).toHaveProperty('user');
      expect(exportRes.body.export.user).not.toHaveProperty('passwordHash');
      expect(exportRes.body.export.checkins.length).toBe(1);
      expect(exportRes.body.export.journalEntries.length).toBe(1);
      expect(exportRes.body.export.journalEntries[0].content).toContain('Personal private thoughts');
    });

    it('permanently deletes all user data across all collections on request', async () => {
      const { token, user } = await registerUser();
      const userId = user.id || user._id;

      await Checkin.create({
        userId,
        mood: 'great',
        energyLevel: 5,
        tags: ['celebration'],
        date: '2026-09-08',
      });

      await Memory.create({
        userId,
        type: 'goal',
        content: 'Finish semester project on time.',
      });

      const deleteRes = await request(app)
        .delete('/api/privacy/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ confirmDelete: true });

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify records are gone from database
      const userCount = await User.countDocuments({ _id: userId });
      const checkinCount = await Checkin.countDocuments({ userId });
      const memoryCount = await Memory.countDocuments({ userId });

      expect(userCount).toBe(0);
      expect(checkinCount).toBe(0);
      expect(memoryCount).toBe(0);
    });
  });
});
