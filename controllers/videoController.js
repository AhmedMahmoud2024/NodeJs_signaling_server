const streamClient = require('../config/stream');

exports.getStreamToken = async(req,res) =>{
    const userId= req.user.userId;
    try{
  const token = streamClient.createToken(userId);
  res.status(200).json({success:true,token});
    }catch(error){
  res.status(500).json({success:false,error:error.message});
    }
}