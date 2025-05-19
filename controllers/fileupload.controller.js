const {checkUser} = require("../services/auth.service");
const {saveFileMetaData, getFileMetaData, getFiles} = require("../services/fileuploader.service");

let fileuploadController = null

class FileUploadController {

    static getFileUploadController() {
        if (!fileuploadController) {
            fileuploadController = new FileUploadController();
        }
        return fileuploadController;
    }

    async uploadFile(req, res) {
        try {
            const {email} = req.user;
            const file = req.file;
            const userData = await checkUser(email);
            const result = await saveFileMetaData({
                user_id: userData.id,
                fileName: file.filename,
                storagePath: file.path,
                title: req.body.title,
                description: req.body.description,
                extractedData: req.body.extractedData
            })

            res.status(201).json({
                "status": 201,
                "message": "File uploaded successfully",
                "data": result
            })
        } catch (exception) {
            res.status(400).json({
                "status": 400,
                "message": "File upload failed: " + exception.message,
                error: {
                    "message": exception.message,
                }
            });
        }
    }

    async getFiles(req, res) {
        try {
            const {email} = req.user;
            const userData = await checkUser(email);
            if (!userData) {
                throw new Error("User not found");
            }

            const { limit, cursor } = req.body;

            const result = await getFiles(userData.id, cursor, limit);

            if (!result) {
                throw new Error("Files not found");
            }

            if (result.total === 0) {
                throw new Error("Files not found");
            }


            let hasMore = false;
            let files = result.files;

            if (files.length > limit) {
                hasMore = true;
                files = result.files.slice(0, limit); // Trim the extra one
            }

            const lastFile = files[files.length - 1];
            const curs = lastFile?.id ?? 0;

            res.status(200).json({
                status: 200,
                message: "Files fetched successfully",
                data: {
                    files: result.files,
                    hasMore,
                    cursor: curs,
                    limit,
                    total: result.total,
                },
            })

        } catch (exception) {
            res.status(400).json({
                "status": 400,
                "message": "Failed to get files: " + exception.message,
                error: {
                    "message": exception.message,
                }
            })
        }
    }

    async getFileMetaData(req, res) {
        try {
            const {email} = req.user;
            const userData = await checkUser(email);
            if (!userData) {
                throw new Error("User not found");
            }
            const id = req.params.id;
            if (!id) {
                throw new Error("File id is required");
            }

            const result = await getFileMetaData(userData.id, id);

            if (!result) {
                throw new Error("File not found");
            }

            res.status(200).json({
                "status": 200,
                "message": "File metadata fetched successfully",
                "data": result,
            })
        } catch (exception) {
            res.status(400).json({
                "status": 400,
                "message": "Failed to get file metadata: " + exception.message,
                error: {
                    "message": exception.message,
                }
            })
        }
    }
}

module.exports.FileUploadController = FileUploadController