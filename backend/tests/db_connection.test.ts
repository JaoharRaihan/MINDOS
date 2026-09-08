import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db';

const describeAtlas = process.env.TEST_LIVE_ATLAS ? describe : describe.skip;

describeAtlas('MongoDB Atlas Connectivity', () => {
  beforeAll(async () => {
    await connectDB();
  }, 15000);

  afterAll(async () => {
    await disconnectDB();
  }, 15000);

  it('should successfully connect to MongoDB Atlas Cluster0 and perform a ping', async () => {
    expect(mongoose.connection.readyState).toBe(1);
    const adminDb = mongoose.connection.db?.admin();
    expect(adminDb).toBeDefined();
    const pingResult = await adminDb?.ping();
    expect(pingResult).toHaveProperty('ok', 1);
  });
});
