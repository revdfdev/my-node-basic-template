const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');


class Utils {

    static ALGORITHM = 'aes-256-gcm';


    static async HashPassword(password) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            return hash;
        } catch (error) {
            throw error;
        }
    }

    static async ComparePassword(password, hash) {
        try {
            const isMatch = await bcrypt.compare(password, hash);
            return isMatch;
        } catch (error) {
            throw error;
        }
    }

    static GenerateToken(user) {
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1d' });
        return token;
    }

    static VerifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded;
        } catch (error) {
            throw error;
        }
    }

    static validateKey(key) {
        // If key is a string, check if base64 encoded
        if (typeof key === 'string') {
            try {
                // Try to decode as base64
                const decoded = Buffer.from(key, 'base64');
                if (decoded.length === 32) {
                    return Promise.resolve(decoded);
                }
            } catch (e) {
                throw new Error("Invalid key format. Must be a string or 32-byte Buffer.");
            }

            // Use PBKDF2 to derive a 32-byte key from the password
            return new Promise((resolve, reject) => {
                const salt = Buffer.from('static-salt-value', 'utf8');
                crypto.pbkdf2(key, salt, 10000, 32, 'sha256', (err, derivedKey) => {
                    if (err) reject(err);
                    else resolve(derivedKey);
                });
            });
        }

        // If key is already a Buffer of correct length, return it
        if (Buffer.isBuffer(key) && key.length === 32) {
            return Promise.resolve(key);
        }

        throw new Error('Invalid key format. Must be a string or 32-byte Buffer.');
    }

    static async Encrypt(plainText, key) {
        const encryptionKey = Buffer.isBuffer(key) && key.length === 32 ? key : await this.validateKey(key);
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(this.ALGORITHM, encryptionKey, iv, {authTagLength: 16});

        let encrypted = cipher.update(plainText, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        // Combine IV, authTag, and encrypted text
        return Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]).toString('base64');
    }

    static async Decrypt(cipherText, key) {
        const encryptionKey = Buffer.isBuffer(key) && key.length === 32 ? key : await this.validateKey(key);
        const buffer = Buffer.from(cipherText, 'base64');

        // Extract the components
        const iv = buffer.slice(0, 12);
        const authTag = buffer.slice(12, 28);
        const encryptedText = buffer.slice(28).toString('hex'); // Convert to hex string

        const decipher = crypto.createDecipheriv(this.ALGORITHM, encryptionKey, iv, {authTagLength: 16});
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}