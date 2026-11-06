const multer = require('multer');

// Memory storage keeps file buffers in memory for direct stream upload to Cloudinary
const storage = multer.memoryStorage();

// Allowed MIME types: images and PDF receipts
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPEG, PNG, WEBP images and PDF documents are allowed.'
      ),
      false
    );
  }
};

// 10 MB maximum file size
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter,
});

module.exports = upload;
