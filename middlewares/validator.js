// middlewares/validate.js
const validate = (schema) => async (req, res, next) => {
    try {
        req.body = await schema.validate(req.body, {
            abortEarly: false, // collect all errors
            stripUnknown: true // remove extra fields
        });
        next();
    } catch (err) {
        res.status(422).json({
            status: 422,
            errors: err.errors,
        });
    }
};

module.exports = {
    validate
};
