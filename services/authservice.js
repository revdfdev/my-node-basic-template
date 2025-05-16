const { compareSync } = require('bcrypt');
const { sign } = require('jsonwebtoken');
const { DatabaseClient } = require("../config/sql");

class AuthService {
    constructor() {
        this.sql = DatabaseClient.getClient().client; // Access the client property
    }

    async login(email, password) {
        try {
            const user = await this.sql.user.findFirst({ // Use this.sql
                where: {
                    email: email,
                },
            });
            console.log("user ", user);
           if (!user) {
                throw new Error('User not found');
            }
            const isPasswordValid = compareSync(password, user.password);
            if (!isPasswordValid) {
                throw new Error('Invalid password');
            }
            const token = await this.generateToken(user.email);
            return token;


        } catch (exception) {
            throw exception;
        }
    }

    async generateToken(field, value) {
        try {
            const token = sign({ [field]: value }, process.env.JWT_SECRET, { expiresIn: '1h' });
            console.log("token");
            return token;
        } catch (exception) {
            throw exception;
        }
    }
}

module.exports.authService = new AuthService();
