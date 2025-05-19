const yaml = require('js-yaml');
const fs = require('fs');
const amqp = require('amqplib');


class Publisher {
    constructor() {
        const config = yaml.load(fs.readFileSync("config/mq.yaml", { encoding: 'utf-8' }));
        this.exchange = config.exchanges[0];
        this.url = config.connection.url;
    }

    async connect() {
        this.connection = await amqp.connect(this.url);
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(this.exchange.name, this.exchange.type, { durable: true });
        console.log(`✅ Publisher connected to exchange: ${this.exchange.name}`);
    }

    async publish(routingKey, message) {
        const payload = Buffer.from(JSON.stringify(message));
        this.channel.publish(this.exchange.name, routingKey, payload);
        console.log(`📤 Published to ${this.exchange.name} with ${routingKey}`);
    }

    async close() {
        await this.channel.close();
        await this.connection.close();
        console.log("🔌 Publisher disconnected");
    }
}

module.exports = {
    Publisher
}