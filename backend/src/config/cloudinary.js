const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a file buffer directly to Cloudinary using upload_stream
 * @param {Buffer} fileBuffer - The in-memory buffer from multer
 * @param {Object} options - Cloudinary upload options (folder, transformation, etc.)
 * @returns {Promise<Object>} - Resolves with Cloudinary upload result
 */
const uploadStream = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    // If Cloudinary credentials are not configured, provide a descriptive error
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return reject(
        new Error(
          'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env'
        )
      );
    }

    const defaultOptions = {
      folder: 'vantrack_lk',
      resource_type: 'auto',
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(
      defaultOptions,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

/**
 * Delete an image by its Cloudinary public ID
 * @param {string} publicId - The Cloudinary public ID
 * @returns {Promise<Object>}
 */
const deleteFile = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

module.exports = {
  cloudinary,
  uploadStream,
  deleteFile,
};
