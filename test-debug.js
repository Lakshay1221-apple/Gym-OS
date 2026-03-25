const request = require('supertest');
const app = require('./app');
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/debug-gymos');
  const res = await request(app).post('/api/auth/login').send({ email: "ghost@test.com", password: "Password123" });
  console.log('STATUS:', res.status);
  console.log('BODY:', JSON.stringify(res.body, null, 2));
  await mongoose.disconnect();
}
test();
