const multer = require("multer");
const path = require("path");
const fs = require("fs");

function uploadTo(folderPath) {
  const fullPath = path.join("public", folderPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
    },
  });

  return multer({ storage });
}

module.exports = uploadTo;