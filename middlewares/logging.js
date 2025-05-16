const logger = require("../config/logger");

const requestBodyLogger = (options = {}) => {
    // Default options
    const {
        logHeaders = false,
        logQueryParams = true,
        excludePaths = [],
        excludeMethods = [],
        maskFields = ['password', 'token'],
    } = options;

    return (req, res, next) => {
        // Skip logging for excluded paths
        if (excludePaths.some(path => req.path.startsWith(path))) {
            return next();
        }

        // Skip logging for excluded methods
        if (excludeMethods.includes(req.method.toUpperCase())) {
            return next();
        }

        const logData = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl || req.url,
            ip: req.ip || req.connection.remoteAddress
        };

        // Log query parameters if enabled
        if (logQueryParams && Object.keys(req.query).length > 0) {
            logData.query = req.query;
        }

        // Log headers if enabled
        if (logHeaders) {
            logData.headers = req.headers;
        }

        // Mask sensitive fields in body
        if (req.body && Object.keys(req.body).length > 0) {
            logData.body = JSON.parse(JSON.stringify(req.body)); // Deep clone

            // Mask sensitive fields
            for (const field of maskFields) {
                if (field.includes('.')) {
                    // Handle nested fields (e.g., 'user.password')
                    const parts = field.split('.');
                    let current = logData.body;
                    for (let i = 0; i < parts.length - 1; i++) {
                        if (current[parts[i]]) {
                            current = current[parts[i]];
                        } else {
                            break;
                        }
                    }

                    const lastPart = parts[parts.length - 1];
                    if (current && current[lastPart] !== undefined) {
                        current[lastPart] = '******';
                    }
                } else if (logData.body[field] !== undefined) {
                    logData.body[field] = '******';
                }
            }
        }

        // Log the request data
        logger.info(`[REQUEST] ${JSON.stringify(logData, null, 2)}`);

        next();
    };
}

const responseBodyLogger = (req, res, next) => {
    const originalSend = res.send;
    res.send = (data) => {
        const responseBody = JSON.stringify(data, null, 2);
        logger.info(new Date().toLocaleString() + ' ===>> Response body : ' + responseBody);
        originalSend.call(res, data);
    };
    next();
};

module.exports = {
    requestBodyLogger,
    responseBodyLogger
};