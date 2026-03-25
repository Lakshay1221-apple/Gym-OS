const admin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ message: "Not authorized as an admin" });
    }
};

const trainer = (req, res, next) => {
    if (req.user && (req.user.role === "trainer" || req.user.role === "admin")) {
        next();
    } else {
        res.status(403).json({ message: "Not authorized as a trainer" });
    }
};

module.exports = { admin, trainer };
