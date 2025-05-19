const express = require("express");
const Logger = require("../config/logger.js");
const {DatabaseClient} = require("../config/sql");
const {authRoutes} = require("../routes/auth.routes")
const {responseBodyLogger, requestBodyLogger} = require("../middlewares/logging");
const {corsMiddleware} = require("../middlewares/cors");
const {sanitizeInput} = require("../middlewares/input");
const {securityHeaders} = require("../middlewares/security");
const {logRoutes} = require("../middlewares/logroutes");
const {errorHandler} = require("../middlewares/error");
const {fileRoutes} = require("../routes/fileupload.routes");
const dotenv = require("dotenv");
const path = require("node:path");

const PORT = process.env.PORT || 3000;

class AppWorker {

    constructor() {
        this.app = express();
        this.initializeSQL();
        this.initializeLogger();
        this.initializeMiddleware();
        this.initializeRoutes();
    }

    initializeMiddleware() {
        this.app.use(express.static('public'));
        this.app.use(express.json({
            limit: '50mb',
            extended: true,
            parameterLimit: 50000,
            type: 'application/json',
        }));
        this.app.use(express.urlencoded({extended: true, limit: '50mb', type: 'application/x-www-form-urlencoded'}));
        this.app.use(requestBodyLogger(
            {
                logHeaders: true,
                excludePaths: ['/health', '/metrics'],
                excludeMethods: ['GET'],
                maskFields: ['password', 'creditCard', 'user.ssn']
            }
        ));
        this.app.use(corsMiddleware);
        this.app.use(sanitizeInput);
        this.app.use(securityHeaders);
        this.app.use(responseBodyLogger);
        this.app.use(errorHandler)
    }

    initializeLogger() {
        this.app.logger = Logger;
    }

    // initializeDatabase() {
    //     Mongo.connect().then(() => {
    //         console.log('Database connected');
    //     }).catch((error) => {
    //         console.log('Database connection failed', error);
    //     })
    //     this.app.mongo = Mongo;
    // }

    initializeSQL() {
        this.app.sql = DatabaseClient.getClient();
    }

    initializeRoutes() {
        this.app.get("/", (req, res) => {
            res.status(200).json({
                status: "success",
                message: "Server is running",
            })
        });
        this.app.use("/v1/auth", authRoutes);
        this.app.use("/v1/files", fileRoutes)
    }

    async run() {
        this.app.use(errorHandler);
        logRoutes(this.app, this.app.logger);
        this.app.listen(PORT, () => {
            this.app.logger.info(`Server running on port ${PORT}`);
        })

        const stopGracefully = async () => {
            try {
                this.app.logger.info('Shutting down server...');
                await this.app.sql.close();
                this.app.logger.info('Server shut down');

                process.exit(0);
            } catch (err) {
                this.app.logger.error("Error during shutdown:", err);
                process.exit(1);
            }
        };

        process.on('SIGINT', stopGracefully);
        process.on('SIGTERM', stopGracefully);
        process.on("uncaughtException", (error) => {
            this.app.logger.error(error);
            process.exit(1);
        });
    }
}

class Worker extends AppWorker {
    start() {
        dotenv.config({
            path: path.resolve(__dirname, '../.env.app')
        });
        Logger.info(new Date().toLocaleString() + ' ===>> Worker PID : ' + process.pid)
        super.run();
    }
}

module.exports.worker = new Worker();