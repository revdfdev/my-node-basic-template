const express = require("express");
const {AuthController} = require("../controllers/authcontroller");
const {FileUploadController} = require("../controllers/fileuploadcontroller");
const {authenticate} = require("../middlewares/auth");


class FileuploadRoutes {

    constructor() {
        this.router = express.Router();
        this.controller = FileUploadController.getFileUploadController();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.use(authenticate);
        this.router.post("", this.controller.uploadFile);
    }

}