const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadFile, deleteFile } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: '/tmp',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.use(protect);
router.post('/lead/:leadId', upload.single('file'), uploadFile);
router.delete('/lead/:leadId/:publicId', deleteFile);
module.exports = router;
