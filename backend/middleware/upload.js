const multer = require('multer');
const s3Service = require('../services/s3Service');

// Configure multer for memory storage (files will be uploaded to S3 directly)
const storage = multer.memoryStorage();

// File filter to accept only images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware to handle single file upload for payment proof
const uploadPaymentProof = upload.single('paymentProof');

// Middleware to handle the actual S3 upload after multer processes the file
const uploadToS3 = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Upload file to S3
    const fileUrl = await s3Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Attach the file URL and original filename to the request
    req.paymentProofUrl = fileUrl;
    req.paymentProofFileName = req.file.originalname;

    next();
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return res.status(500).json({ 
      error: 'Failed to upload file to S3',
      details: error.message 
    });
  }
};

module.exports = {
  uploadPaymentProof,
  uploadToS3,
};
