const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');

// POST /api/calls/save - Save a new call log
router.post('/save', callController.saveCallLog);

// GET /api/calls/history/:userId - Get paginated call history for a user
// Query params: page (default: 1), limit (default: 20)
router.get('/history/:userId', callController.getCallHistory);

// DELETE /api/calls/:callId - Delete a specific call log
router.delete('/:callId', callController.deleteCallLog);

module.exports = router;