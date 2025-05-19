const yup = require('yup');

const uploadSchema = yup.object().shape({
    file: yup.mixed().required(),
    title: yup.string().required(),
    description: yup.string().optional(),
})

const getFilesSchema = yup.object().shape({
    cursor: yup.number().optional(),
    limit: yup.number().required(),
})

module.exports = {
    uploadSchema,
    getFilesSchema,
};