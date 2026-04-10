const jwt =require('jsonwebtoken');
require('dotenv').config();
const console = require('console');
const express = require('express');
const http = require('http');
const {Server}=require('socket.io');
const connectDB = require('./config/db');
const callRoutes = require('./routes/callRoutes');
const {
  handleMakeCall,
  handleEndCall,
  handleMissedCall,
  handleStoreUser,
  handleTestConnection,
  handleDisconnect
} = require('./socket/callHandlers');

const app =express();
const server = http.createServer(app)
// congigure socket with allowing call from any where cors
const io = new Server(server,{
    cors :{origin : "*"}
});
 
 connectDB();
  app.get('/get-stream-token',async(req,res)=>{
  const userId= req.query.userId;
  const apiSecret= process.env.STREAM_API_SECRET
  if(!userId){
     return res.status(400).json({success:false,message:'User ID is required'});
  }
 try{
  const token = jwt.sign({
    user_id: userId,
    exp:Math.floor(Date.now() /1000) + (60*60)
  },
  apiSecret,
  {
     algorithm : 'HS256'
  },
 );
 res.json({token:token});
 }catch(error){
     res.status(500).json({
         error:error.message
     });
 }
 
  });
app.use(express.json());
app.use('/api/calls',callRoutes);
 
 
let users={};
io.on('connection',(socket)=>{
    console.log(`A user connected: ${socket.id}`);

    // Store user ID to socket mapping
    socket.on('store_user', handleStoreUser(socket, users));

    // Call management handlers
    socket.on('make-call', handleMakeCall(io, socket, users));
    socket.on('end-call', handleEndCall(io, socket, users));
    socket.on('missed-call', handleMissedCall(io, socket, users));

    // Test connection handler
    socket.on('test-connection', handleTestConnection(socket));

    // Cleanup on disconnect
    socket.on('disconnect', handleDisconnect(socket, users));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT,'0.0.0.0',()=>{
    console.log(`Server is running on port ${PORT}`);
});
