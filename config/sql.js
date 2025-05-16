const { PrismaClient } = require("@prisma/client")
const logger = require("./logger");

let instance = null;

class DatabaseClient {

    constructor() {
        this.client = new PrismaClient(); // Initialize the Prisma client here
        instance = this; // Corrected: store the instance.
        logger.info("SQL connection created");
    }

    static getClient() {
        if (!instance) {
            instance = new DatabaseClient();
        }
        return instance; // Return the instance of DatabaseClient, not just the client
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
