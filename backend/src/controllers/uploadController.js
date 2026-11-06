const { uploadStream, deleteFile } = require('../config/cloudinary');

/**
 * @desc    Upload single image/document to Cloudinary
 * @route   POST /api/upload
 * @access  Private (JWT required)
 */
exports.uploadSingleFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please provide a file field named "file" or "image".',
      });
    }

    // Determine target folder based on query param or body
    const folderType = req.query.type || req.body.type || 'general';
    const folderMap = {
      avatar: 'vantrack_lk/avatars',
      student: 'vantrack_lk/students',
      vehicle: 'vantrack_lk/vehicles',
      license: 'vantrack_lk/licenses',
      receipt: 'vantrack_lk/receipts',
      incident: 'vantrack_lk/incidents',
      general: 'vantrack_lk/general',
    };

    const targetFolder = folderMap[folderType] || folderMap.general;

    // Upload buffer to Cloudinary
    const result = await uploadStream(req.file.buffer, {
      folder: targetFolder,
      public_id: `${folderType}_${Date.now()}`,
    });

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully to Cloudinary',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        originalName: req.file.originalname,
        uploadedAt: result.created_at,
      },
    });
  } catch (error) {
    console.error('[Cloudinary Upload Error]', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading file to Cloudinary',
    });
  }
};

/**
 * @desc    Delete a file from Cloudinary
 * @route   DELETE /api/upload
 * @access  Private (JWT required)
 */
exports.deleteUploadedFile = async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the Cloudinary publicId to delete',
      });
    }

    const result = await deleteFile(publicId);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting file',
    });
  }
};
