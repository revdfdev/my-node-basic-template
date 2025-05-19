const {DatabaseClient} = require("../config/sql");
const {Publisher} = require("../mq/publisher");
const {calculateFileHash} = require("../config/fileutils");
const path = require("node:path");



async function getFiles(userId, cursor, limit) {
    try {
        const db = DatabaseClient.getClient();
        if (!db) {
            throw new Error('Database client not initialized');
        }
        const total = await db.file.count({
            where: {
                user: {
                    id: userId,
                },
            },
        })

        const files = await db.file.findMany({
            take: limit  + 1,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),
            where: {
                user: {
                    id: userId,
                },
            },
            include: {
                user: false,
            },
            orderBy: {
                id: 'asc',
            }
        });
        return {
            files,
            total,
        };
    } catch (exception) {
        throw new Error(exception.message);
    }
}

async function saveFileMetaData(data) {
    const {user_id, fileName, storagePath, title, description} = data;
    const publisher = new Publisher();
    try {
        const db = DatabaseClient.getClient();
        await publisher.connect();
        const fileData = {
            originalFilename: fileName,
            storagePath: storagePath,
            title: title ?? null,
            description: description ?? null,
            status: 'UPLOADED',
            user: { //  Use "user" here, not "user_id"
                connect: {
                    id: user_id, //  The user_id goes inside the "connect" object
                },
            },
        };

        const result = await db.file.create({
            data: fileData,
        });


        if (!result) {
            throw new Error('Failed to save file metadata');
        }

        const jobData = {
            jobType: 'FILE_PROCESSING',
            status: "QUEUED",
            file: {
                connect: {
                    id: result.id,
                },
            },
        };

        const jobResult = await db.job.create({
            data: jobData,
        });

        if (!jobResult) {
            throw new Error('Failed to save job metadata');
        }

        await publisher.publish("file.upload", JSON.stringify({
            jobId: jobResult.id,
            status: jobResult.status
        }))

        return {
            id: result.id,
            status: result.status,
        };
    } catch (exception) {
        console.log("exception", exception.message);
        throw new Error(exception.message);
    } finally {
        await publisher.close();
    }
}

async function getFileMetaData(userId, id) {
    try {
        const db = DatabaseClient.getClient();

        if (!db) {
            throw new Error('Database client not initialized');
        }

        const file = await db.file.findUnique({
            where: {
                id: parseInt(id),
                user: {
                    id: userId,
                },
            },
            include: {
                user: false,
            }
        });

        if (!file) {
            throw new Error('File not found');
        }

        return {
            fileName: file.originalFilename,
            storagePath: file.storagePath,
            title: file.title,
            description: file.description,
            status: file.status,
            extractedData: file.extractedData
        };
    } catch (exception) {
        throw new Error(exception.message);
    }
}

async function processFile(msg) {
    const message = msg.content.toString();
    console.log("raw message ===", message);
    const payload = JSON.parse(JSON.parse(message));

    console.log("Final payload object:", payload);
    console.log("Job ID:", payload.jobId);

    try {
        if (!payload || !payload.jobId) {
            throw new Error('Invalid payload');
        }
        const {jobId} = payload;
        const db = DatabaseClient.getClient();

        const job = await db.job.findUnique({
            where: {
                id: jobId,
            },
            include: {
                file: true,
            },
        });

        if (!job) {
            throw new Error('Job not found');
        }

        console.log("job---- =", job);

        const processingJob = await db.job.update({
            where: {id: job.id},
            data: {
                status: "PROCESSING",
                startedAt: new Date(),
                file: {
                    update: {
                        status: "PROCESSING",
                    },
                }
            },
        });

        if (!processingJob) {
            throw new Error('Failed to update job status');
        }

        const file = job.file;

        if (!file) {
            throw new Error('File not found');
        }

        const filePath = path.resolve(__dirname, "../", file.storagePath);

        let fileHash;
        try {
            fileHash = await calculateFileHash(filePath);
        } catch (error) {
            throw new Error(`Error calculating hash: ${error.message}`);
        }

        const updatedJob = await db.job.update({
            where: {id: job.id},
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                file: {
                    update: {
                        status: "PROCESSED",
                        extractedData: fileHash,
                    },
                }
            },
        });

        if (!updatedJob) {
            throw new Error('Failed to update records');
        }

        return {
            id: updatedJob.id,
            status: updatedJob.status,
        };

    } catch (exception) {
        const db = DatabaseClient.getClient();
        try {
            if (!payload || !payload.jobId) {
                throw new Error('Invalid payload');
            }
            await db.job.update({
                where: {id: payload.jobId},
                data: {
                    status: "FAILED",
                    error: error.message,
                    file: {
                        update: {
                            status: "FAILED",
                        },
                    }
                },
            });
        } catch (updateError) {
            console.error("Error updating job status:", updateError.message);
            throw new Error(updateError.message);
        }

        console.error("Error processing file:", exception.message);
        throw new Error(exception.message);
    }
}


module.exports = {
    saveFileMetaData,
    getFileMetaData,
    processFile,
    getFiles,
}