const mongoose= require('mongoose');

const callSchema = new mongoose.Schema({
      callerId:String,
      receiverId:String,
      status:{
          type:String,
          enum:['calling','completed',,'missed','declined'],
          default:'calling'
      },
      duration:Number,
  }
  );
  
module.exports = mongoose.model('CallLog',callSchema);