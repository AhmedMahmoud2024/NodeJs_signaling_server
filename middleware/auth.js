const jwt = require('jsonwebtoken');

const auth = async(req,res,next)=>{
    try{
     const authHeader = req.header('Authorization');
     if(!authHeader || !authHeader.startsWith('Bearer ' )){
        res.status(401).json({
            success:false,
            message: 'No Token , authorization denied',
        });

     }
       const token = authHeader.split(' ')[1];
       const decoded = jwt.verify(token,process.env.JWT_SECRET);
       req.user= decoded;
       next();
    }catch(error){
 console.error('Auth Middleware Error:',error.message);
 res.status(401).json({
    success:false ,
    message:"Token is not valid"
 });
    }
}
module.exports = auth ;