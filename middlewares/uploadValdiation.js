const multer = require("multer");
const  { uploadSchema } = require("../validations/upload");

const storage = multer.memoryStorage(); // or diskStorage
const upload = multer({ storage });

function validateUpload(req, res, next) {
    const data = {
        file: req.file,
        title: req.body.title,
        description: req.body.description
    };

    uploadSchema.validate(data, { abortEarly: false })
        .then(() => next())
        .catch((err) => {
            return res.status(400).json({
                status: "error",
                errors: err.errors,
            });
        });
}

module.exports = {
    upload,
    validateUpload
};
