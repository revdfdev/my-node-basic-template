const express = require('express');
const { AuthController } = require('../controllers/authcontroller');
const {validate} = require("../middlewares/validator");
const  { loginSchema } = require("../validations/login");

 class AuthRoutes {
    constructor() {
        this.router = express.Router();
        this.controller = AuthController.getAuthController();
        this.initializeRoutes();
    }

    initializeRoutes() {
       this.router.post("/login", validate(loginSchema), this.controller.Login);
    }
}

module.exports.authRoutes = new AuthRoutes().router;