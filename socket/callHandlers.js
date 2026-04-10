const CallLog = require('../models/callLog');

/**
 * Socket.IO event handlers for call management
 * These handlers manage the call lifecycle: initiation, completion, and logging
 */

/**
 * Handle incoming call initiation
 * Creates initial call log record with status 'calling' and startTime
 * Emits incoming-call event to the receiver
 */
const handleMakeCall = (io, socket, users) => {
  return async (data) => {
    try {
      const { callerId, receiverId } = data;

      if (!callerId || !receiverId) {
        console.error('[make-call] Missing callerId or receiverId');
        return;
      }

      // Create new call log with status 'calling'
      const newCall = new CallLog({
        callerId,
        receiverId,
        status: 'calling',
        startTime: new Date(),
        duration: 0
      });

      await newCall.save();
      console.log(`[make-call] Call log created: ${newCall._id}`);

      // Emit incoming call to receiver
      const receiverSocketId = users[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('incoming-call', {
          callerId,
          receiverId,
          callId: newCall._id
        });
        console.log(`[make-call] Incoming call emitted to ${receiverId}`);
      } else {
        console.warn(`[make-call] Receiver ${receiverId} not found online`);
      }
    } catch (error) {
      console.error('[make-call] Error:', error);
      socket.emit('call-error', { message: 'Failed to initiate call' });
    }
  };
};

/**
 * Handle call completion
 * Updates call log with endTime, calculates duration, and sets status to 'completed'
 * Emits call-ended event to both parties for real-time UI update
 */
const handleEndCall = (io, socket, users) => {
  return async (data) => {
    try {
      const { callerId, receiverId, duration } = data;

      if (!callerId || !receiverId) {
        console.error('[end-call] Missing callerId or receiverId');
        return;
      }

      // Find and update the most recent call between these users
      const endTime = new Date();
      const callDuration = duration || 0;

      const updatedCall = await CallLog.findOneAndUpdate(
        {
          callerId,
          receiverId,
          status: 'calling'
        },
        {
          status: 'completed',
          endTime,
          duration: callDuration
        },
        { new: true }
      );

      if (updatedCall) {
        console.log(`[end-call] Call ${updatedCall._id} completed with duration ${callDuration}s`);

        // Emit call-ended event to both caller and receiver for real-time updates
        io.to(callerId).emit('call-ended', {
          callId: updatedCall._id,
          status: 'completed',
          duration: callDuration,
          endTime: endTime.toISOString()
        });
        io.to(receiverId).emit('call-ended', {
          callId: updatedCall._id,
          status: 'completed',
          duration: callDuration,
          endTime: endTime.toISOString()
        });
      } else {
        console.warn('[end-call] No active call found to update');
      }
    } catch (error) {
      console.error('[end-call] Error:', error);
      socket.emit('call-error', { message: 'Failed to end call' });
    }
  };
};

/**
 * Handle missed calls
 * Updates call log with status 'missed' and current time as endTime
 * Emits call-missed event to receiver
 */
const handleMissedCall = (io, socket, users) => {
  return async (data) => {
    try {
      const { callerId, receiverId } = data;

      if (!callerId || !receiverId) {
        console.error('[missed-call] Missing callerId or receiverId');
        return;
      }

      const endTime = new Date();

      const missedCall = await CallLog.findOneAndUpdate(
        {
          callerId,
          receiverId,
          status: 'calling'
        },
        {
          status: 'missed',
          endTime,
          duration: 0
        },
        { new: true }
      );

      if (missedCall) {
        console.log(`[missed-call] Call ${missedCall._id} marked as missed`);

        // Emit missed call notification to both parties
        io.to(callerId).emit('call-missed', {
          callId: missedCall._id,
          receiverId
        });
        io.to(receiverId).emit('call-missed', {
          callId: missedCall._id,
          callerId
        });
      }
    } catch (error) {
      console.error('[missed-call] Error:', error);
      socket.emit('call-error', { message: 'Failed to mark call as missed' });
    }
  };
};

/**
 * Handle user connection and room joining
 * Stores user ID to socket mapping for real-time call routing
 */
const handleStoreUser = (socket, users) => {
  return (userId) => {
    if (!userId) {
      console.error('[store_user] User ID is required');
      return;
    }
    socket.join(userId); // Join Socket.IO room named after userId
    users[userId] = socket.id;
    console.log(`[store_user] User ${userId} connected with socket ${socket.id}`);
  };
};

/**
 * Handle test connection messages from clients
 */
const handleTestConnection = (socket) => {
  return (data) => {
    console.log(`[test-connection] Message from client:`, data);
    socket.emit('test-response', {
      reply: 'Server received your message'
    });
  };
};

/**
 * Handle user disconnection
 * Cleans up user mapping and room
 */
const handleDisconnect = (socket, users) => {
  return () => {
    // Find and remove user from users object
    const disconnectedUserId = Object.keys(users).find(
      userId => users[userId] === socket.id
    );

    if (disconnectedUserId) {
      delete users[disconnectedUserId];
      socket.leave(disconnectedUserId); // Leave Socket.IO room
      console.log(`[disconnect] User ${disconnectedUserId} disconnected`);
    } else {
      console.log(`[disconnect] User with socket ${socket.id} disconnected`);
    }
  };
};

module.exports = {
  handleMakeCall,
  handleEndCall,
  handleMissedCall,
  handleStoreUser,
  handleTestConnection,
  handleDisconnect
};
