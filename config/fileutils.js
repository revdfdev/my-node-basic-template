
const fs = require("fs")
const crypto = require('crypto');

const calculateFileHash = async (filePath) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    return new Promise((resolve, reject) => {
        stream.on('data', (data) => {
            hash.update(data);
        });

        stream.on('end', () => {
            const fileHash = hash.digest('hex');
            resolve(fileHash);
        });

        stream.on('error', (err) => {
            reject(err);
        });
    });
};

module.exports = {
    calculateFileHash
}