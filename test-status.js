const express = require('express');
const responseFormatter = require('./src/middleware/responseFormatter');
const request = require('supertest');

const app = express();
app.use(responseFormatter);
app.get('/error', (req, res) => {
    res.status(401).json({ error: 'bad' });
});

request(app).get('/error').end((err, res) => {
  console.log("FINAL STATUS:", res.statusCode);
  console.log("BODY:", JSON.stringify(res.body));
});
