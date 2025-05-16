

let fileuploadcontroller = null

class FileUploadController {

    static getFileUploadController() {
        if (!fileuploadcontroller) {
            fileuploadcontroller = new FileUploadController();
        }
        return fileuploadcontroller;
    }

    async uploadFile(req, res) {
        try {
            if (req.headers["content-type"] !== "multipart/form-data") {
                throw new Error("Invalid content type");
            }

            if (!req.files || !req.files.file) {
                throw new Error("No file uploaded");
            }

            const file = req.files.file;
            const filePath = file.path;
            res
                .status(200)
                .json({ filePath: filePath, message: "File uploaded successfully" });
        } catch (error) {
            res
                .status(400)
                .json({ error: error.message });
        }
    }
}

module.exports.FileUploadController = FileUploadController