const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');

const verboseTransport = new winston.transports.DailyRotateFile({
    filename: 'access-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
})

const errorTransport = new winston.transports.DailyRotateFile({
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
});

verboseTransport.on('rotate', (oldFileName, newFileName) => {
    console.log('rotating file', oldFileName, newFileName);
    fs.rename(oldFileName, './oldLogs/' + oldFileName, (err) => {
        if (err) throw err;
    });
});

errorTransport.on('rotate', (oldFileName, newFileName) => {
    fs.rename(oldFileName, './oldLogs/' + oldFileName, (err) => {
        if (err) throw err;
    });
});

const logger = winston.createLogger({
    defaultMeta: {service: 'app-service'},
    level: 'verbose',
    format: winston.format.json(),
    exitOnError: false,
    transports: [errorTransport, verboseTransport],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    );
}

module.exports = logger;