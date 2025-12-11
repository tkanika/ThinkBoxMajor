import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';

// Ensure dotenv is loaded
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for local storage first, then upload to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for large PDFs
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp', 
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain', // .txt
      'application/octet-stream' // Generic binary - check extension
    ];
    
    // Check mimetype or file extension for PDFs
    const isPdf = file.mimetype === 'application/pdf' || 
                  file.originalname.toLowerCase().endsWith('.pdf');
    const isDocx = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                   file.originalname.toLowerCase().endsWith('.docx');
    const isDoc = file.mimetype === 'application/msword' ||
                  file.originalname.toLowerCase().endsWith('.doc');
    const isTxt = file.mimetype === 'text/plain' ||
                  file.originalname.toLowerCase().endsWith('.txt');
    
    if (allowedTypes.includes(file.mimetype) || isPdf || isDocx || isDoc || isTxt) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, PDF, DOCX, TXT'), false);
    }
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, filename, mimetype) => {
  return new Promise((resolve, reject) => {
    // For PDFs, use image resource type with pdf format
    const isPdf = mimetype === 'application/pdf';
    const resourceType = mimetype.startsWith('image/') || isPdf ? 'image' : 'raw';
    
    const uploadOptions = {
      folder: 'thinkbox',
      resource_type: resourceType,
      public_id: filename,
    };
    
    // Add format for PDFs
    if (isPdf) {
      uploadOptions.format = 'pdf';
      uploadOptions.flags = 'attachment'; // Ensure it's downloadable
    }
    
    console.log('Uploading to Cloudinary:', filename, '| Type:', mimetype, '| Resource:', resourceType);
    
    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Upload successful:', result.secure_url);
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

export { cloudinary, upload, uploadToCloudinary };