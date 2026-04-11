const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../utils/siteMediaUpload');
const {
    getSiteSettings, updateSiteSettings, createSection, updateSection, deleteSection, uploadSiteMedia
} = require('../controllers/siteSettingsController');

router.get('/', getSiteSettings);                                          // public
router.put('/', auth, updateSiteSettings);
router.post('/upload-media', auth, upload.single('file'), uploadSiteMedia); // video/image upload
router.post('/sections', auth, createSection);
router.put('/sections/:id', auth, updateSection);
router.delete('/sections/:id', auth, deleteSection);

module.exports = router;
