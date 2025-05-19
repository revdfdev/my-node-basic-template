
const amqp = require('amqplib');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const Logger = require('../config/logger');
const {DatabaseClient} = require("../config/sql");
const dotenv = require("dotenv");
const {processFile} = require("../services/fileuploader.service");

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 10000; // 10 seconds delay

class RabbitmqWorker {

    constructor() {
        this.config = null;
        this.connection = null;
        this.channel = null;
        this.sql = null;
        this.logger = null;
    }

    async loadConfig() {
        try {
            const configFile = fs.readFileSync("./config/mq.yaml", { encoding: 'utf-8' });
            console.log("config ", configFile);
            return await yaml.load(configFile, {
                schema: yaml.JSON_SCHEMA,
                json: true,
                filename: path.resolve("./config/mq.yaml"),
            });
        } catch (exception) {
            Logger.error("Failed to load Rabbitmq config:", exception.message);
            process.exit(1);
        }
    }

    initializeLogger() {
        this.logger = Logger;
    }

    initializeSQL() {
        this.sql = DatabaseClient.getClient();
    }

    async initialize() {
        try {
            this.initializeLogger();
            this.initializeSQL();
            this.logger.info("Connecting to rabbitmq...");
            this.config = await this.loadConfig();
            this.connection = await amqp.connect(this.config.connection.url);
            this.channel = await this.connection.createChannel();
            for (const exchange of this.config.exchanges) {
                await this.channel.assertExchange(exchange.name, exchange.type, { durable: true });

                for (const queue of exchange.queues) {
                    await this.channel.assertQueue(queue.name, {
                        durable: true,
                        deadLetterExchange: queue.deadLetterExchange || undefined,
                        deadLetterRoutingKey: queue.deadLetterRoutingKey || undefined,
                    });

                    await this.channel.bindQueue(queue.name, exchange.name, queue.routingKey);
                    this.channel.consume(queue.name, (msg) => {
                        console.log("Received message from queue:", msg);
                        if (msg) {
                            this.handleMessage(msg, queue.name, queue.routingKey);
                        }
                    }, { noAck: false });

                    if (queue.deadLetterExchange) {
                        const deadLetterQueueName = `${queue.name}.dlq`;
                        await this.channel.assertQueue(deadLetterQueueName, { durable: true });

                        await this.channel.consume(deadLetterQueueName, async (msg) => {
                            if (!msg) return;

                            const retryCount = (msg.properties.headers?.['x-retry-count'] || 0);
                            const payload = JSON.parse(msg.content.toString());

                            if (retryCount < MAX_RETRY_COUNT) {
                                const retryQueueName = `${queue.name}.retry.${retryCount + 1}`;
                                const retryRoutingKey = `${queue.routingKey}.retry.${retryCount + 1}`;
                                const delayExchange = `${queue.deadLetterExchange}.retry`;

                                await this.channel.assertExchange(delayExchange, 'direct', { durable: true });
                                await this.channel.assertQueue(retryQueueName, {
                                    durable: true,
                                    messageTtl: RETRY_DELAY_MS,
                                    deadLetterExchange: exchange.name,
                                    deadLetterRoutingKey: queue.routingKey,
                                });

                                await this.channel.bindQueue(retryQueueName, delayExchange, retryRoutingKey);

                                this.logger.warn(`[DLQ] Retrying ${queue.name}, attempt ${retryCount + 1}`);

                                this.channel.publish(delayExchange, retryRoutingKey, Buffer.from(JSON.stringify(payload)), {
                                    headers: {
                                        'x-retry-count': retryCount + 1
                                    }
                                });
                            } else {
                                this.logger.error(`[DLQ] Message failed after ${MAX_RETRY_COUNT} retries: ${JSON.stringify(payload)}`);
                                // Optionally: store to a "permanent fail" queue
                            }

                            this.channel.ack(msg);
                        }, { noAck: false });
                    }
                }
            }
            this.logger.info("Rabbitmq consumers initiated");
        } catch (excpeption) {
            Logger.error('RabbitMQ initialization error:', excpeption);
            process.exit(1);
        }
    }

    async handleMessage(msg, queueName, routingKey) {
        try {
            switch (queueName) {
                case "file.processing.queue":
                    await processFile(msg);
                    break;
                default:
                    this.logger.warn("Unknown queue name:", queueName);
                    return this.channel.nack(msg, false, false);
            }

            this.channel.ack(msg);
        } catch (error) {
            this.logger.error("Error processing message:", error);
            this.channel.nack(msg, false, false);
        }
    }

    async close() {
        try {
            if (this.channel) await this.channel.close();
            if (this.connection) await this.connection.close();
            if (this.sql) await this.sql.close();
            if (this.logger) await this.logger.close();
            this.logger.info("Rabbitmq connection closed");
        } catch (exception) {
            this.logger.error("Failed to close Rabbitmq connection:", exception.message);
        }
    }

    async run() {
        await this.initialize();
        const stopGracefully = async () => {
            await this.close();
            process.exit(0);
        }

        process.on('SIGINT', stopGracefully);
        process.on('SIGTERM', stopGracefully);
        process.on('uncaughtException', async (err) => {
            Logger.error('Uncaught Exception:', err);
            await this.close();
            process.exit(1);
        });
    }
}


class Worker extends RabbitmqWorker {
    start() {
        dotenv.config({
            path: path.resolve(__dirname, '../.env.rabbitmq')
        });
        Logger.info(new Date().toLocaleString() + ' ===>> Worker PID : ' + process.pid)
        super.run();
    }
}

module.exports.worker = new Worker();