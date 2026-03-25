const validateRequest = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (e) {
        return res.status(400).json({
            message: "Validation Error",
            errors: (e.issues ?? e.errors ?? []).map(err => ({
                path: err.path.join('.'),
                message: err.message
            })),
        });
    }
};

module.exports = validateRequest;
