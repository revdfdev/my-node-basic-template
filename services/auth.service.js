const { compareSync } = require('bcrypt');
const { sign } = require('jsonwebtoken');
const { DatabaseClient } = require("../config/sql");
const { Utils } = require("../config/utils");

async function login(email, password) {
    try {
        const db = DatabaseClient.getClient();
        const result = await db.user.findFirst({ // Use this.sql
            where: {
                email: email,
            },
        });
        if (!result) {
            throw new Error('User not found');
        }
        const isPasswordValid = Utils.ComparePassword(password, result.password);
        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }
        return await Utils.GenerateToken("email", result.email, "1h");
    } catch (exception) {
        throw new Error(exception.message);
    }
}

async function checkUser(email) {
    try {
        const db = DatabaseClient.getClient();
        if (!db) {
            throw new Error("Database not connected");
        }
        const result = await db.user.findUnique({
            where: {
                email: email,
            },
        });
        if (!result) {
            throw new Error("User not found");
        }
        return result;
    } catch (exception) {
        throw new Error(exception.message);
    }
}

module.exports = { login, checkUser };