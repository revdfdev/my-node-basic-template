const sanitizeInput = (req, res, next) => {
    const clean = (obj) => {
        for (let key in obj) {
            if (/^\$/.test(key)) {
                delete obj[key];
            } else if (typeof obj[key] === 'object') {
                clean(obj[key]);
            }
        }
    };
    if (req.body) clean(req.body);
    if (req.query) clean(req.query);
    next();
};

module.exports = {
    sanitizeInput
}