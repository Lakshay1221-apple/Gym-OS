const request = require("supertest");
const app = require("./app");
const db = require("./tests/db");

async function run() {
  await db.connect();
  const res = await request(app).post("/api/auth/register").send({}); // Intentional empty body to trigger 400 validation error
  console.log("STATUS:", res.statusCode);
  console.log("BODY:", JSON.stringify(res.body, null, 2));
  await db.disconnect();
}
run();
