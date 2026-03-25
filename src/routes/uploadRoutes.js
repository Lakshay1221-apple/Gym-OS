const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");

// @route   POST /api/uploads
// @desc    Upload an image (profile image / progress photo)
// @access  Private
router.post("/", protect, upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file provided or invalid file type" });
    }
    res.status(201).json({
        message: "Image uploaded successfully",
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
    });
});

module.exports = router;
