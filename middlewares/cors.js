const corsMiddleware = (req, res, next) => {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
};

module.exports = {
    corsMiddleware
}