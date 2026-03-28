const console = require('console');
const express = require('express');
const http = require('http');
const {Server}=require('socket.io');

const app =express();
const server = http.createServer(app)
// congigure socket with allowing call from any where cors
const io = new Server(server,{
    cors :{origin : "*"}
});
let users={};
io.on('connection',(socket)=>{
    console.log(`A user connected: ${socket.id}`);

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

socket.on('disconnect',()=>{
    console.log('User disconnected');
});

}

);

server.listen(3000,'0.0.0.0',()=>{
    console.log('Server is running on port 3000');
});