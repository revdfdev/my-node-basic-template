const multer = require('multer');
const path = require('path');
const fs = require('fs');

class FileUploader {
    constructor(options = {}) {
        this.options = {
            storageType: options.storageType || 'disk',
            destination: options.destination || 'uploads/',
            filename: options.filename || this.defaultFilename,
            maxFileSize: options.maxFileSize || '10MB',
            allowedFileTypes: options.allowedFileTypes,
            onError: options.onError || this.defaultErrorHandler,
            cleanup: options.cleanup || false,
        };
        this.storage = this.configureStorage();
        this.upload = multer({
            storage: this.storage,
            limits: this.configureLimits(),
            fileFilter: this.configureFileFilter(),
        });
        this.cleanupEnabled = this.options.cleanup;
    }

    configureStorage() {
        if (this.options.storageType === 'memory') {
            return multer.memoryStorage();
        } else {
            if (!fs.existsSync(this.options.destination)) {
                fs.mkdirSync(this.options.destination, { recursive: true });
            }
            return multer.diskStorage({
                destination: (req, file, cb) => {
                    cb(null, this.options.destination);
                },
                filename: (req, file, cb) => {
                    const newFilename = this.options.filename(req, file, (err, newName) => {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, newName);
                    });
                },
            });
        }
    }

    configureLimits() {
        const limits = {};
        if (this.options.maxFileSize) {
            const size = this.parseSize(this.options.maxFileSize);
            if (size === null) {
                throw new Error(`Invalid maxFileSize: ${this.options.maxFileSize}.  Use a valid format like '10MB', '500KB', or '1GB'`);
            }
            limits.fileSize = size;
        }
        return limits;
    }

    configureFileFilter() {
        if (!this.options.allowedFileTypes) {
            return (req, file, cb) => {
                cb(null, true);
            };
        }
        return (req, file, cb) => {
            if (this.options.allowedFileTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`File type ${file.mimetype} not allowed. Allowed types are: ${this.options.allowedFileTypes.join(', ')}`), false);
            }
        };
    }

    defaultFilename(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const newFilename =  uniqueSuffix + fileExtension;
        cb(null, newFilename);
    }

    defaultErrorHandler(err, req, res, next) {
        if (err instanceof multer.MulterError) {
            res.status(400).json({ error: 'Multer error: ' + err.message });
        } else {
            res.status(500).json({ error: 'File upload failed: ' + err.message });
        }
    }

    parseSize(sizeString) {
        const regex = /^(\d+)([KMGT]B)$/i;
        const match = sizeString.match(regex);
        if (!match) {
            return null;
        }
        const value = parseInt(match[1], 10);
        const unit = match[2].toUpperCase();
        switch (unit) {
            case 'KB':
                return value * 1024;
            case 'MB':
                return value * 1024 * 1024;
            case 'GB':
                return value * 1024 * 1024 * 1024;
            case 'TB':
                return value * 1024 * 1024 * 1024 * 1024;
            default:
                return null;
        }
    }

    single(fieldName) {
        return (req, res, next) => {
            this.upload.single(fieldName)(req, res, (err) => {
                if (err) {
                    this.options.onError(err, req, res, next);
                } else {
                    this.handleCleanup(req);
                    next();
                }
            });
        };
    }

    array(fieldName, maxCount) {
        return (req, res, next) => {
            this.upload.array(fieldName, maxCount)(req, res, (err) => {
                if (err) {
                    this.options.onError(err, req, res, next);
                } else {
                    this.handleCleanup(req);
                    next();
                }
            });
        };
    }

    fields(fields) {
        return (req, res, next) => {
            this.upload.fields(fields)(req, res, (err) => {
                if (err) {
                    this.options.onError(err, req, res, next);
                } else {
                    this.handleCleanup(req);
                    next();
                }
            });
        };
    }

    handleCleanup(req) {
        if (this.cleanupEnabled) {
            if (req.file) {
                this.deleteFile(req.file.path);
            } else if (req.files) {
                if (Array.isArray(req.files)) {
                    req.files.forEach(file => this.deleteFile(file.path));
                } else {
                    for (const fieldName in req.files) {
                        req.files[fieldName].forEach(file => this.deleteFile(file.path));
                    }
                }
            }
        }
    }

    deleteFile(filePath) {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting file: ${filePath}`, err);
                } else {
                    console.log(`File deleted: ${filePath}`);
                }
            });
        }
    }
}

module.exports = FileUploader;