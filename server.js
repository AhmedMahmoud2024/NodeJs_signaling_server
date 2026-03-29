const console = require('console');
const express = require('express');
const http = require('http');
const {Server}=require('socket.io');
const mongoose= require('mongoose');
const app =express();
const server = http.createServer(app)
// congigure socket with allowing call from any where cors
const io = new Server(server,{
    cors :{origin : "*"}
});
  mongoose.connect('mongodb://127.0.0.1:3000/chatApp');
 
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
  
const CallLog = mongoose.model('CallLog',callSchema);
 
let users={};
io.on('connection',(socket)=>{
    console.log(`A user connected: ${socket.id}`);

      socket.on('make-call',async(data)=>{
      try{
    const newCall= new CallLog({
  callerId:data.callerId,
  receiverId:data.receiverId,
  status:'calling',
  startTime :new Date()
      });   

     await  newCall.save()
      console.log('call log saved successfully');
  }catch(error){
      console.error('Error saving call log:',error);
  }
  }
  
  );

 

 
  
 
  
//user store
socket.on('store_user',(userId)=>{
users[userId]=socket.id;
console.log(`User stored: ${userId} is online`);
});
//signaling pass 
socket.on('make-call',(data)=>{
const receiverSocketId=users[data.receiverId];
if(receiverSocketId){
io.to(receiverSocketId).emit('incoming-call',data);
}
});

socket.on('test-connection',(data)=>{
    console.log('message from Flutter:',data.message);
});
/*
socket.on('test-response',{
    reply:'Server Says I hear you very clear'
});
*/
socket.on('disconnect',()=>{
    console.log('User disconnected');
});


}

);

server.listen(3000,'0.0.0.0',()=>{
    console.log('Server is running on port 3000');

});
