const request = require('supertest');
const app = require('../src/app');
const Slot = require('../src/models/Slot');
const Machine = require('../src/models/Machine');
const User = require('../src/models/User');
const CompletedSession = require('../src/models/CompletedSession');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock Mongoose models
jest.mock('../src/models/Slot');
jest.mock('../src/models/Machine');
jest.mock('../src/models/User');
jest.mock('../src/models/CompletedSession');

describe('🔒 Security & Latency Optimizations Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Machine Profile Authentication & Kiosk Security', () => {
    it('should reject requests to session/retrieve if machine headers are missing', async () => {
      const response = await request(app)
        .post('/api/v1/session/retrieve')
        .send({ phone_number: '9876543210', pin: '4921' });

      expect(response.status).toBe(400); // Bad Request because of missing x-machine-id
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('x-machine-id');
    });

    it('should reject requests if machine password header is missing', async () => {
      const response = await request(app)
        .post('/api/v1/session/retrieve')
        .set('x-machine-id', 'C01')
        .send({ phone_number: '9876543210', pin: '4921' });

      expect(response.status).toBe(401); // Unauthorized because of missing x-machine-password
      expect(response.body.error).toContain('x-machine-password');
    });

    it('should reject requests if machine is not registered in database', async () => {
      Machine.findOne.mockResolvedValue(null); // Machine not found

      const response = await request(app)
        .post('/api/v1/session/retrieve')
        .set('x-machine-id', 'C01')
        .set('x-machine-password', 'wrongpassword')
        .send({ phone_number: '9876543210', pin: '4921' });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('credentials invalid');
    });

    it('should reject requests if machine password is incorrect', async () => {
      Machine.findOne.mockResolvedValue({
        machine_id: 'C01',
        password: await bcrypt.hash('secretpassword', 10),
        location: 'MALL_CENTRAL'
      });

      const response = await request(app)
        .post('/api/v1/session/retrieve')
        .set('x-machine-id', 'C01')
        .set('x-machine-password', 'wrongpassword')
        .send({ phone_number: '9876543210', pin: '4921' });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('credentials invalid');
    });
  });

  describe('2. PIN Validation & Slot Assignment', () => {
    beforeEach(() => {
      // Mock successful machine authentication globally for these test cases
      Machine.findOne.mockResolvedValue({
        machine_id: 'C01',
        password: bcrypt.hashSync('secretpassword', 10),
        location: 'MALL_CENTRAL'
      });
    });

    it('should reject assignment if PIN is sequential (e.g. 1234)', async () => {
      const response = await request(app)
        .post('/api/v1/slots/assign')
        .set('x-machine-id', 'C01')
        .set('x-machine-password', 'secretpassword')
        .send({
          phone_number: '9876543210',
          pin: '1234',
          slot_number: '3'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Sequential PIN');
    });

    it('should reject assignment if PIN is repetitive (e.g. 1111)', async () => {
      const response = await request(app)
        .post('/api/v1/slots/assign')
        .set('x-machine-id', 'C01')
        .set('x-machine-password', 'secretpassword')
        .send({
          phone_number: '9876543210',
          pin: '1111',
          slot_number: '3'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Repetitive PIN');
    });

    it('should reject assignment if PIN is not exactly 4 digits', async () => {
      const response = await request(app)
        .post('/api/v1/slots/assign')
        .set('x-machine-id', 'C01')
        .set('x-machine-password', 'secretpassword')
        .send({
          phone_number: '9876543210',
          pin: '492',
          slot_number: '3'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('PIN must be exactly 4 digits');
    });
  });

  describe('3. Credential Enumeration Protection on retrieval', () => {
    beforeEach(() => {
      // Mock successful machine authentication globally for these test cases
      Machine.findOne.mockResolvedValue({
        machine_id: 'C01',
        password: bcrypt.hashSync('secretpassword', 10),
        location: 'MALL_CENTRAL'
      });
    });

    it('should return uniform generic error if no active session exists for phone number', async () => {
      // Mock findActiveSessionByPhoneAndMachine to return null (no active session)
      const mockSlotService = require('../src/services/slotService');
      jest.spyOn(mockSlotService, 'findActiveSessionByPhoneAndMachine').mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/session/retrieve')
        .set('x-machine-id', 'C01')
        .set('x-machine-password', 'secretpassword')
        .send({
          phone_number: '9876543210',
          pin: '4921'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid phone number or PIN entered.');
    });

    it('should return identical uniform generic error if active session exists but PIN is wrong', async () => {
      const mockSlotService = require('../src/services/slotService');
      
      // Phone has session but PIN does not match
      jest.spyOn(mockSlotService, 'findActiveSessionByPhoneAndMachine').mockResolvedValue({
        machine_id: 'C01',
        slot_number: 3,
        user_phone: '9876543210',
        status: 'LOCKED_CHARGING'
      });
      jest.spyOn(mockSlotService, 'findSlotForRetrieval').mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/session/retrieve')
        .set('x-machine-id', 'C01')
        .set('x-machine-password', 'secretpassword')
        .send({
          phone_number: '9876543210',
          pin: '9999' // Wrong PIN
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid phone number or PIN entered.');
    });
  });

  describe('4. Admin Machine Deletion & Verification', () => {
    const adminToken = jwt.sign({ id: 'mockadminid' }, process.env.JWT_SECRET || 'aibotink_secret_key_123');

    it('should reject machine deletion if authorization token is missing', async () => {
      const response = await request(app)
        .delete('/api/v1/admin/machines/C01')
        .send({ admin_password: 'adminpassword' });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Access denied');
    });

    it('should reject machine deletion if admin password is missing', async () => {
      const response = await request(app)
        .delete('/api/v1/admin/machines/C01')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Admin password is required');
    });

    it('should reject machine deletion if admin password is incorrect', async () => {
      User.findById.mockResolvedValue({
        _id: 'mockadminid',
        email: 'admin@test.com',
        password: bcrypt.hashSync('adminpassword', 10)
      });

      const response = await request(app)
        .delete('/api/v1/admin/machines/C01')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ admin_password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Incorrect admin password');
    });

    it('should successfully delete machine and all slots if admin password is correct', async () => {
      User.findById.mockResolvedValue({
        _id: 'mockadminid',
        email: 'admin@test.com',
        password: bcrypt.hashSync('adminpassword', 10)
      });
      Machine.findOneAndDelete.mockResolvedValue({ machine_id: 'C01' });
      Slot.deleteMany.mockResolvedValue({ deletedCount: 10 });

      const response = await request(app)
        .delete('/api/v1/admin/machines/C01')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ admin_password: 'adminpassword' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
      expect(response.body.deletedCount).toBe(10);
      expect(Machine.findOneAndDelete).toHaveBeenCalledWith({ machine_id: 'C01' });
      expect(Slot.deleteMany).toHaveBeenCalledWith({ machine_id: 'C01' });
    });
  });

  describe('5. Admin Completed Session History Deletion', () => {
    const adminToken = jwt.sign({ id: 'mockadminid' }, process.env.JWT_SECRET || 'aibotink_secret_key_123');

    it('should reject session history deletion if authorization token is missing', async () => {
      const response = await request(app)
        .delete('/api/v1/admin/sessions/mocksessionid');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Access denied');
    });

    it('should successfully delete completed session history when authorized', async () => {
      CompletedSession.findByIdAndDelete.mockResolvedValue({
        _id: 'mocksessionid',
        machine_id: 'C01',
        slot_number: 5,
        user_phone: '8770825839',
        status: 'COMPLETED'
      });

      const response = await request(app)
        .delete('/api/v1/admin/sessions/mocksessionid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
      expect(CompletedSession.findByIdAndDelete).toHaveBeenCalledWith('mocksessionid');
    });

    it('should return 404 if session history does not exist', async () => {
      CompletedSession.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/admin/sessions/nonexistentsessionid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('history not found');
    });
  });
});
