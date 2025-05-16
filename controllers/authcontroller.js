const { authService } = require("../services/authservice");


let authController = null;

class AuthController {

    $service = null;

    constructor() {
        // Initialize service directly
        this.$service = authService;
    }

    // Singleton instance

    static getAuthController() {
        if (!authController) {
            authController = new AuthController();
        }
        return authController;
    }

    async Login(req, res) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({
                    status: 400,
                    message: "Email and password are required"
                });
            }

            const token = await authService.login(email, password);
            
            if (!token) {
                return res.status(401).json({
                    status: 401,
                    message: "Invalid credentials"
                });
            }

            return res.status(200).json({
                status: 200,
                message: "Login successful",
                data: { token }
            });
        } catch (error) {
            return res.status(400).json({
                status: 400,
                message: error.message
            });
        }
    }
}

module.exports.AuthController = AuthController;