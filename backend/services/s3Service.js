const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.S3_BUCKET_NAME;
const cloudFrontUrl = process.env.CLOUDFRONT_URL;

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} fileName - The name of the file
 * @param {string} contentType - The MIME type of the file
 * @returns {Promise<string>} The URL of the uploaded file
 */
const uploadFile = async (fileBuffer, fileName, contentType) => {
  try {
    const key = `payment-proofs/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    
    // Return CloudFront URL if available, otherwise S3 URL
    if (cloudFrontUrl) {
      return `${cloudFrontUrl}/${key}`;
    }
    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
};

/**
 * Get signed URL for a file
 * @param {string} key - The S3 key of the file
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string>} The signed URL
 */
const getSignedUrlForFile = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw new Error('Failed to get signed URL');
  }
};

/**
 * Delete file from S3
 * @param {string} key - The S3 key of the file
 * @returns {Promise<void>}
 */
const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Extract S3 key from URL
 * @param {string} url - The full URL of the file
 * @returns {string} The S3 key
 */
const extractKeyFromUrl = (url) => {
  if (!url) return null;
  
  // Remove CloudFront URL or S3 URL to get the key
  if (cloudFrontUrl && url.startsWith(cloudFrontUrl)) {
    return url.replace(`${cloudFrontUrl}/`, '');
  }
  
  const s3UrlPattern = new RegExp(`https://${bucketName}\\.s3\\.[^.]+\\.amazonaws\\.com/(.+)`);
  const match = url.match(s3UrlPattern);
  return match ? match[1] : null;
};

module.exports = {
  uploadFile,
  getSignedUrlForFile,
  deleteFile,
  extractKeyFromUrl,
};
