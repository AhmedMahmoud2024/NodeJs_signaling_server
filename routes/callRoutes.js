const express = require('express');
const router= express.Router(); 
const CallLog = require('../models/callLog');


router.get('/call-history/:myUser',async(req,res)=>{
    const history= await CallLog.find({
  $or:[{callerId: req.params.userId},
     {receiverId: req.params.userId}]
    }).sort({startTime:-1});
    res.status(200).json(history);
}
);
module.exports= router;