const express = require("express");
const {FileUploadController} = require("../controllers/fileupload.controller");
const {authenticate} = require("../middlewares/auth");
const FileUploader = require("../config/fileuploader");
const {validateUpload} = require("../middlewares/uploadValdiation");
const {validate} = require("../middlewares/validator");
const {getFilesSchema} = require("../validations/upload");


class FileRoutes {

    constructor() {
        this.router = express.Router();
        this.fileuploader = new FileUploader({
            storageType: 'disk',
            destination: 'uploads',
            maxFileSize: '5MB',
            cleanup: false
        })
        this.controller = FileUploadController.getFileUploadController();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.use(authenticate);
        this.router.post("", validate(getFilesSchema), this.controller.getFiles);
        this.router.get("/:id", this.controller.getFileMetaData);
        this.router.post("/upload",this.fileuploader.single("file"), validateUpload, this.controller.uploadFile);

    }

}

module.exports.fileRoutes = new FileRoutes().router;
