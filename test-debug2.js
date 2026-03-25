const request = require("supertest");
const app = require("./app");

async function run() {
  const res = await request(app)
    .post("/api/auth/register")
    .send({});
  console.log("STATUS:", res.statusCode);
  console.log("BODY:", JSON.stringify(res.body, null, 2));
  process.exit(0);
}
run();
