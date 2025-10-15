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

  const fileFilter = (req, file, cb) => {
    try {
      // Allow only images by default
      if (file && file.mimetype && file.mimetype.startsWith("image/")) {
        return cb(null, true);
      }
      // Fallback by extension check
      const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      const ext = path.extname(file.originalname || "").toLowerCase();
      if (allowed.includes(ext)) return cb(null, true);
    } catch (_) {}
    return cb(new Error("ไฟล์ไม่รองรับ"));
  };

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter,
  });
}

module.exports = uploadTo;
