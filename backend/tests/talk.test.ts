import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Conversation } from '../src/models/Conversation';
import { Message } from '../src/models/Message';

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
  await Conversation.deleteMany({});
  await Message.deleteMany({});
});

describe('AI Companion & Talk Endpoints', () => {
  const testUser = {
    email: 'talk_user@mindos.me',
    password: 'Password123!',
    name: 'Samiul Islam',
    preferredName: 'Samiul',
  };

  const getAuthToken = async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    return res.body.tokens.accessToken;
  };

  describe('POST /api/talk/message', () => {
    it('should reject unauthenticated message with 401', async () => {
      const res = await request(app).post('/api/talk/message').send({ message: 'Hello' });
      expect(res.status).toBe(401);
    });

    it('should understand Banglish study overwhelm and reply with practical options without diagnostic jargon', async () => {
      const token = await getAuthToken();
      const userText = 'bhai amar mathay onk kichu choltesey, porte boshte partesi na.';

      const res = await request(app)
        .post('/api/talk/message')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: userText });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.userMessage.text).toBe(userText);
      expect(res.body.assistantMessage).toBeDefined();
      expect(res.body.assistantMessage.text).toContain('getting started feels harder');
      expect(res.body.assistantMessage.options).toContain('Yes, let’s do 5 min');
      expect(res.body.assistantMessage.options).toContain('Just talk');

      // Crucial: Must NOT contain medicalized diagnosis
      expect(res.body.assistantMessage.text).not.toMatch(/ADHD|disorder|diagnosis|CBT/i);

      // Verify internal backend signals were saved to conversation behind the scenes
      const conversation = await Conversation.findById(res.body.conversationId);
      expect(conversation?.signals?.emotion).toBe('overwhelmed');
      expect(conversation?.signals?.difficulty).toBe('task_initiation');
    });

    it('should intercept crisis expressions with Bangladesh emergency resources', async () => {
      const token = await getAuthToken();
      const crisisText = 'I want to end my life, everything is hopeless';

      const res = await request(app)
        .post('/api/talk/message')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: crisisText });

      expect(res.status).toBe(200);
      expect(res.body.assistantMessage.text).toContain('Kaan Pete Roi');
      expect(res.body.assistantMessage.text).toContain('+8801779554391');
      expect(res.body.assistantMessage.text).toContain('999');
      expect(res.body.assistantMessage.options).toContain('Call Kaan Pete Roi');
    });
  });

  describe('GET /api/talk/history & POST /api/talk/reset', () => {
    it('should retrieve conversation history and reset session on demand', async () => {
      const token = await getAuthToken();

      // 1. Send first message
      await request(app)
        .post('/api/talk/message')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'chakri niye tension e asi' });

      // 2. Fetch history
      const historyRes = await request(app)
        .get('/api/talk/history')
        .set('Authorization', `Bearer ${token}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.messages.length).toBe(2); // 1 user + 1 assistant

      // 3. Reset session
      const resetRes = await request(app)
        .post('/api/talk/reset')
        .set('Authorization', `Bearer ${token}`);

      expect(resetRes.status).toBe(200);

      // 4. Verify history after reset returns blank active conversation
      const postResetRes = await request(app)
        .get('/api/talk/history')
        .set('Authorization', `Bearer ${token}`);

      expect(postResetRes.body.conversation).toBeNull();
      expect(postResetRes.body.messages.length).toBe(0);
    });
  });
});
