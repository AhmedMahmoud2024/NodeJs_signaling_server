const mongoose= require('mongoose');

const callSchema = new mongoose.Schema({
      callerId: String,
      receiverId: String,
      status: {
          type: String,
          enum: ['calling', 'completed', 'missed', 'declined'],
          default: 'calling'
      },
      duration: Number,
      startTime: { type: Date, required: true },
      endTime: { type: Date, default: null },
      createdAt: { type: Date, default: Date.now }
  }
  );

// Add TTL index for auto-deletion after 90 days (7,776,000 seconds)
callSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
  
module.exports = mongoose.model('CallLog',callSchema);