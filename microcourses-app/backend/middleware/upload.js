const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Storage configuration for different file types
const createStorage = (subfolder) => {
  const uploadPath = path.join(__dirname, '../uploads', subfolder);
  ensureDirExists(uploadPath);
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });
};

// File filter for images
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Please upload only image files (jpg, png, gif, etc.)'), false);
  }
};

// File filter for videos
const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Please upload only video files'), false);
  }
};

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Please upload only document files (PDF, DOC, DOCX, TXT)'), false);
  }
};

// Upload configurations
const uploads = {
  // For course thumbnails
  courseThumbnail: multer({
    storage: createStorage('course-thumbnails'),
    fileFilter: imageFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  }).single('thumbnail'),
  
  // For lesson videos
  lessonVideo: multer({
    storage: createStorage('lesson-videos'),
    fileFilter: videoFilter,
    limits: {
      fileSize: 100 * 1024 * 1024 // 100MB
    }
  }).single('video'),
  
  // For lesson materials
  lessonMaterials: multer({
    storage: createStorage('lesson-materials'),
    fileFilter: documentFilter,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    }
  }).array('materials', 5),
  
  // For user avatars
  userAvatar: multer({
    storage: createStorage('avatars'),
    fileFilter: imageFilter,
    limits: {
      fileSize: 2 * 1024 * 1024 // 2MB
    }
  }).single('avatar')
};

module.exports = uploads;