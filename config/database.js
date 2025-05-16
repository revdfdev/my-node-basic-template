

const mongodb = require("mongodb");
const logger = require("./logger");
const {exceptions} = require("winston");

const MONGO_URL = process.env.MONGODB_URL;

class Mongo {
    async connect() {
        try {
            const client = mongodb.MongoClient;
            this.connection = await client.connect(MONGO_URL, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            logger.info("MongoDB connected");
        } catch (exception) {
            console.log("exception", exception);
           logger.error('MongoDB connection failed:', exception.message);
            throw exception;
        }
    }

    async generateSerialForCollection(dbName, collectionName) {
        try {
            const db = this.connection.db(dbName)
            const counters = db.collection('counters');

            const today = new Date();
            const dateKey = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
            const counterId = `${collectionName}_${dateKey}`; // e.g. "users_20250416"

            const result = await counters.findOneAndUpdate(
                { _id: counterId },
                { $inc: { seq: 1 } },
                { upsert: true, returnDocument: 'after' }
            );

            return result.value.seq; // 1, 2, 3...
        } catch (exception) {
            throw exception
        }
    }

    async distinct(db_name, collection_name, distinct_param) {
        try {
            const database = await this.connection.db(db_name);
            const result = await database
                .collection(collection_name)
                .distinct(distinct_param);
            if (!result) throw new Error('Failed to get result for distinct query');
            return result;
        } catch (exception) {
            throw exception;
        }
    }

    async findOne(db_name, collection_name, find_params, select_params = {}) {
        try {
            const database = await this.connection.db(db_name);
            if (!database) throw new Error('Database does not exist');
            return await database
                .collection(collection_name)
                .findOne(find_params, {projection: select_params});
        } catch (exception) {
            throw exception;
        }
    }

    async find(db_name, collection_name, find_params, select_params = {}, sort={}) {
        try {
            const database = await this.connection.db(db_name);
            return await database
                .collection(collection_name)
                .find(find_params)
                .project(select_params)
                .sort(sort)
                .toArray();
        } catch (exception) {
            throw exception;
        }
    }

    async findWithLimit(db_name, collection_name, find_params, select_params = {}, limit = 0) {
        try {
            const database = await this.connection.db(db_name);
            return await database
                .collection(collection_name)
                .find(find_params)
                .addCursorFlag('noCursorTimeout', true)
                .project(select_params)
                .limit(limit)
                .toArray();
        } catch (exception) {
            throw exception;
        }
    }

    async findWithLimitAndSort(db_name, collection_name, find_params, select_params = {}, sort={}, limit = 0) {
        try {
            const database = await this.connection.db(db_name);
            return await database
                .collection(collection_name)
                .find(find_params)
                .addCursorFlag('noCursorTimeout', true)
                .project(select_params)
                .limit(limit)
                .sort(sort)
                .toArray();
        } catch (exception) {
            throw exception;
        }
    }

    async findWithLimitAndOffset(db_name, collection_name, find_params, select_params = {}, limit = 0, offset = 0) {
        try {
            const database = await this.connection.db(db_name);
            return await database
                .collection(collection_name)
                .find(find_params)
                .addCursorFlag('noCursorTimeout', true)
                .project(select_params)
                .skip(offset)
                .limit(limit)
                .toArray();
        } catch (exception) {
            throw exception;
        }
    }

    async findWithLimitAndOffsetAndSort(db_name, collection_name, find_params, select_params = {}, sort = {}, limit = 0, offset = 0) {
        try {
            const database = await this.connection.db(db_name);
            return await database
                .collection(collection_name)
                .find(find_params)
                .addCursorFlag('noCursorTimeout', true)
                .project(select_params)
                .skip(offset)
                .limit(limit)
                .sort(sort)
                .toArray();
        } catch (exception) {
            throw exception;
        }
    }

    async aggregate(db_name, collection_name, find_params, select_params = {}, sort_params = {}) {
        try {
            const database = await this.connection.db(db_name);
            return await database
                .collection(collection_name)
                .aggregate([find_params, select_params, sort_params])
                .toArray();
        } catch (exception) {
            throw exception;
        }
    }

    async custom_aggregate(db_name, collection_name, params) {
        try {
            const database = await this.connection.db(db_name);
            return await database
                .collection(collection_name)
                .aggregate(params)
                .toArray();
        } catch (exception) {
            throw exception;
        }
    }

    async insert(db_name, collection_name, document) {
        try {
            const database = await this.connection.db(db_name);
            const inserted = await database
                .collection(collection_name)
                .insertOne(document);
            if (!inserted.acknowledged) throw new Error('Failed to insert');
            return inserted;
        } catch (exception) {
            throw exception;
        }
    }

    async update(db_name, collection_name, find_params, update_params) {
        try {
            const database = await this.connection.db(db_name);
            const result = await database.collection(collection_name).updateMany(
                find_params,
                { $set: update_params },
                { upsert: true }
            );
            if (!result.acknowledged) throw new Error('Failed to update');
            return result;
        } catch (exception) {
            throw exception;
        }
    }

    async updateWithoutUpsert(db_name, collection_name, find_params, update_params) {
        try {
            const database = await this.connection.db(db_name);
            const result = await database
                .collection(collection_name)
                .updateMany(find_params, { $set: update_params });
            if (!result.acknowledged) throw new Error('Failed to update data');
            return result;
        } catch (exception) {
            throw exception;
        }
    }

    async updateWithInsert(db_name, collection_name, find_params, update_insert_params) {
        try {
            const database = await this.connection.db(db_name);
            const result = await database.collection(collection_name).updateOne(
                find_params,
                { $set: update_insert_params },
                { upsert: true }
            );
            if (!result.acknowledged) throw new Error('Failed to update with insert');
            return result;
        } catch (exception) {
            throw exception;
        }
    }

    async multiUpdate(db_name, collection_name, params) {
        try {
            const database = await this.connection.db(db_name);
            const result = await database.collection(collection_name).updateMany(
                params.find_params,
                { $set: params.update_params },
                { upsert: true }
            );
            if (!result.acknowledged) throw new Error('Failed to update');
            return result;
        } catch (exception) {
            throw exception;
        }
    }

    async increment(db_name, collection_name, find_params, increment_fields) {
        try {
            const database = await this.connection.db(db_name);
            const result = await database.collection(collection_name).updateOne(
                find_params,
                { $inc: increment_fields }
            );
            if (!result.acknowledged) throw new Error('Failed to increment fields');
            return result;
        } catch (exception) {
            throw exception;
        }
    }
}

module.exports.mongo = new Mongo();