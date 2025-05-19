const { PrismaClient } = require("@prisma/client")
const logger = require("./logger");

let instance = null;

class DatabaseClient {

    constructor() {
        this.client = new PrismaClient();
        instance = this;
        logger.info("SQL connection created");
    }

    static getClient() {
        if (!instance) {
            const d = new DatabaseClient();
            instance = d.client;
        }
        return instance;
    }
    async close() {
        try {
            await this.client.$disconnect();
            logger.info("SQL connection closed");
        } catch (error) {
            logger.error("Failed to close SQL connection", error);
            throw error;
        }
    }
}

module.exports.DatabaseClient = DatabaseClient;
