const express = require('express');
const router= express.Router();
const {getStreamToken}= require('../controllers/videoController');
const auth = require('../middleware/authMiddleware');

router.get('/token',getStreamToken);
module.exports= router;