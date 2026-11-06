const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { protect } = require('../middlewares/auth');
const {
  uploadSingleFile,
  deleteUploadedFile,
} = require('../controllers/uploadController');

// Accept file under field 'file' or 'image'
router.post(
  '/',
  protect,
  upload.single('file'),
  uploadSingleFile
);

router.delete('/', protect, deleteUploadedFile);

module.exports = router;
