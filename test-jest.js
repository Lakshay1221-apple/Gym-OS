const request = require("supertest");
const app = require("./app");
const db = require("./tests/db");

async function run() {
  await db.connect();
  const res = await request(app).post("/api/auth/register").send({
      name: "No Gym",
      email: "nogym@test.com",
      password: "password123",
  });
  console.log("STATUS:", res.statusCode);
  console.log("BODY:", JSON.stringify(res.body));
  await db.disconnect();
}
run();
