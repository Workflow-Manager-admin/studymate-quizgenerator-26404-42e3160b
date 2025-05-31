// File upload middleware (PDF/DOCX) using Multer for StudyMate QuizGenerator

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage directory for uploaded files
const uploadDir = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * File type filter: accepts only PDF and DOCX files.
 */
function fileFilter(req, file, cb) {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files allowed'), false);
  }
}

/**
 * Multer storage configuration.
 * Filenames use format: file-fieldname-yyyyMMddHHmmss.ext
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `${file.fieldname}-${timestamp}${ext}`);
  },
});

/**
 * PUBLIC_INTERFACE
 * Multer middleware for handling single file uploads with validation.
 */
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter,
});

module.exports = upload;
