const CallLog = require('../models/callLog');

/**
 * Save a new call log record
 * Receives: { callerId, receiverId, status, callType, duration, startTime, endTime }
 */
exports.saveCallLog = async (req, res) => {
  try {
    const { callerId, receiverId, status, duration, startTime, endTime } = req.body;

    // Validate required fields
    if (!callerId || !receiverId || !startTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: callerId, receiverId, startTime' 
      });
    }

    // Validate endTime >= startTime if provided
    if (endTime && new Date(endTime) < new Date(startTime)) {
      return res.status(400).json({ 
        success: false, 
        error: 'endTime must be greater than or equal to startTime' 
      });
    }

    const newCall = new CallLog({
      callerId,
      receiverId,
      status: status || 'completed',
      duration: duration || 0,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      createdAt: new Date()
    });

    await newCall.save();

    res.status(201).json({ 
      success: true, 
      data: {
        _id: newCall._id,
        callerId: newCall.callerId,
        receiverId: newCall.receiverId,
        status: newCall.status,
        duration: newCall.duration,
        startTime: newCall.startTime.toISOString(),
        endTime: newCall.endTime ? newCall.endTime.toISOString() : null,
        createdAt: newCall.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('[saveCallLog] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get call history with pagination
 * Query params: page (default: 1), limit (default: 20)
 * Returns all calls where user is either caller or receiver
 */
exports.getCallHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate pagination params
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(parseInt(limit), 100)); // Cap at 100
    const skip = (pageNum - 1) * limitNum;

    // Get calls where user is either caller or receiver
    const calls = await CallLog.find({
      $or: [{ callerId: userId }, { receiverId: userId }]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean() // Use lean() for faster queries when not modifying
      .exec();

    // Get total count for pagination
    const total = await CallLog.countDocuments({
      $or: [{ callerId: userId }, { receiverId: userId }]
    });

    // Format response data
    const formattedCalls = calls.map(call => ({
      _id: call._id,
      callerId: call.callerId,
      receiverId: call.receiverId,
      status: call.status,
      duration: call.duration,
      startTime: call.startTime.toISOString(),
      endTime: call.endTime ? call.endTime.toISOString() : null,
      createdAt: call.createdAt.toISOString()
    }));

    res.json({
      success: true,
      data: formattedCalls,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('[getCallHistory] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete a specific call log record
 */
exports.deleteCallLog = async (req, res) => {
  try {
    const { callId } = req.params;

    const deleted = await CallLog.findByIdAndDelete(callId);

    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        error: 'Call log not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Call log deleted successfully' 
    });
  } catch (error) {
    console.error('[deleteCallLog] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
