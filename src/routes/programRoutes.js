const express = require("express");
const router = express.Router();
const validateRequest = require("../middleware/validateRequest");
const { createProgramSchema, assignProgramSchema } = require("../validations/workout.schemas");

const {
    createProgram,
    getPrograms,
    assignProgram,
    getMyAssignments,
    getTrainerClients,
} = require("../controllers/programController");
const { protect } = require("../middleware/authMiddleware");

// Role-based auth protection middleware specifically checking for Trainer / Admin scope
const trainerOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "trainer")) {
        next();
    } else {
        res.status(403).json({ message: "Not authorized as a trainer or admin" });
    }
};

router.route("/")
    .get(protect, getPrograms)
    .post(protect, trainerOrAdmin, validateRequest(createProgramSchema), createProgram);

router.post("/assign", protect, trainerOrAdmin, validateRequest(assignProgramSchema), assignProgram);

router.get("/my-clients", protect, trainerOrAdmin, getTrainerClients);

router.get("/my-assignments", protect, getMyAssignments);

module.exports = router;
