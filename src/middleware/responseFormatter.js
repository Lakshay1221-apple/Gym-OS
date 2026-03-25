const responseFormatter = (req, res, next) => {
    const originalJson = res.json;

    res.json = function (obj) {
        // Prevent double wrapping
        if (obj && Object.prototype.hasOwnProperty.call(obj, "success")) {
            return originalJson.call(this, obj);
        }

        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

        const wrapped = {
            success: isSuccess,
            data: isSuccess ? obj : null,
            message: obj?.message || (isSuccess ? "Request successful" : "An error occurred"),
        };

        // If it's an error, we keep the original error structure in data if debug is needed, 
        // but typically errors are handled by errorMiddleware which sends its own format.
        if (!isSuccess && obj && obj.stack) {
            wrapped.data = { stack: obj.stack }; // optional for dev
        }

        return originalJson.call(this, wrapped);
    };

    next();
};

module.exports = responseFormatter;
