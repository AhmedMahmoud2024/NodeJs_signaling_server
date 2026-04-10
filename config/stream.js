const jwt = require('jsonwebtoken') ;
const {StreamVideoClient}= require('@getstream/video-node-sdk');
const { application } = require('express');
const streamClient= new StreamVideoClient(
    process.env.STREAM_API_KEY,
     process.env.STREAM_API_SECRET);
 const client = new StreamVideoClient(api,sercret);
 application.get('/get-stream-token',async(req,res)=>{
 const userId= req.query.userId;
 if(!userId){
    return res.status(400).json({success:false,message:'User ID is required'});
 }
try{
 const token =  jwt.sign({
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
  
 //streamClient.createToken({user_id: userId});
//res.json({token:token});
// });

module.exports= router;     