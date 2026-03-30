require('dotenv').config();
const console = require('console');
const express = require('express');
const http = require('http');
const {Server}=require('socket.io');
const connectDB = require('./config/db');
const callRoutes = require('./routes/callRoutes');
const app =express();
const server = http.createServer(app)
// congigure socket with allowing call from any where cors
const io = new Server(server,{
    cors :{origin : "*"}
});
 
 connectDB();
app.use(express.json());
app.use('/api/calls',callRoutes);
 
 
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

socket.on('end-call', async(data)=>{
   const savedLog = await CallLog.create({
    callerId:data.callerId,
    receiverId:data.receiverId,
    status:data.status['completed']
   })
});
}

);

const PORT = process.env.PORT || 3000;
server.listen(PORT,'0.0.0.0',()=>{
    console.log(`Server is running on port ${PORT}`);
});
