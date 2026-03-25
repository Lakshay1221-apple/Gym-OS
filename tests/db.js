/**
 * Shared DB lifecycle helper.
 * Every test file calls connect/clearDB/disconnect in its own beforeAll/afterEach/afterAll
 * so each suite gets a completely isolated replica set.
 */
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

let replSet;

/**
 * Start a single-node replica set and connect Mongoose to it.
 * Must be called inside a beforeAll with a generous timeout (≥ 30s).
 */
const connect = async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(replSet.getUri());
};

/** Wipe every collection — call in afterEach for test isolation. */
const clearDB = async () => {
    await Promise.all(
        Object.values(mongoose.connection.collections).map((c) => c.deleteMany({}))
    );
};

/** Disconnect and shut down the replica set. */
const disconnect = async () => {
    await mongoose.disconnect();
    await replSet.stop();
};

module.exports = { connect, clearDB, disconnect };
