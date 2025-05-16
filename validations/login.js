const yup = require('yup');

const loginSchema = yup.object().shape({
    email: yup.string().required(),
    password: yup.string().required().min(8).max(36),
})

module.exports = {
    loginSchema
};