const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');


class Utils {

    static ALGORITHM = 'aes-256-gcm';


    static async HashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }

    static async ComparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    static GenerateToken(field, value, expiresIn) {
        return jwt.sign({[field]: value}, process.env.JWT_SECRET, {expiresIn: expiresIn});
    }

    static VerifyToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
    }
}

module.exports = {
    Utils
};