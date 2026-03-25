require("dotenv").config();
const mongoose = require("mongoose");

const testDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("SUCCESS: Connected to MongoDB!");

        // Create a temporary schema for testing
        const TestModel = mongoose.model("Test", new mongoose.Schema({ name: String }));
        
        // Write test data
        console.log("Creating test record...");
        const doc = await TestModel.create({ name: "db_test_" + Date.now() });
        console.log("SUCCESS: Created record with ID:", doc._id);

        // Read test data
        console.log("Reading test record...");
        const retrieved = await TestModel.findById(doc._id);
        if (retrieved && retrieved.name === doc.name) {
            console.log("SUCCESS: Read record successfully:", retrieved.name);
        } else {
            throw new Error("Failed to read the exact record back.");
        }

        // Clean up
        console.log("Cleaning up test record...");
        await TestModel.findByIdAndDelete(doc._id);
        console.log("SUCCESS: Cleanup complete.");

        console.log("\nALL TESTS PASSED. MongoDB is perfectly working.");
    } catch (error) {
        console.error("\nERROR: MongoDB test failed!");
        console.error(error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

testDB();
