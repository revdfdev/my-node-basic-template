const jwt = require('jsonwebtoken');
const {verify} = require("jsonwebtoken");
const moment = require("moment");

function authenticate(req, res, next) {

    const headers = req.headers["Authorization"] || req.headers["authorization"];
    if (!headers) {
        res.status(401).json({
            status: 401,
            message: "UnAuthorized"
        })
        return
    }

    if (!headers.startsWith("Bearer ")) {
        res.status(401).json({
            status: 401,
            message: "UnAuthorized"
        })
        return
    }

    const token = headers.split(" ")[1];

    if (!token) {
        res.status(401).json({
            status: 401,
            message: "UnAuthorized"
        })
        return
    }

    verify(token, process.env.JWT_SECRET, function (err, deocoded) {
        if (err) {
            res.status(401).json({
                status: 401,
                message: "UnAuthorized"
            });
            return
        }

        req.user =  {
            email: deocoded.email
        };
        next();
    });
}

module.exports = {
    authenticate
}