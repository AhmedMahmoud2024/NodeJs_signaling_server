const  application  = require('express');
const mongoose= require('mongoose');
/*
mongoose.connect('mongodb://192.168.0.105:3000/curd');
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

 socket.on('make-call',async(data)=>{
    try{
    const newCall= new CallLog({
callerId:data.callerId,
receiverId:data.receiverId,
status:'calling',
startTime :new Date()
    })
   await  newCall.save()
    console.log('call log saved successfully');
}catch(error){
    console.error('Error saving call log:',error);
}
}

);

*/
application.get('/call-history/:userId',async(req,res)=>{
    const history= await CallLog.find({
  receiverId: req.params.userId
    }).sort({startTime:-1});
    res.json(history);
})

socket.on('end-call', async(data)=>{
   const savedLog = await CallLog.create({
    callerId:data.callerId,
    receiverId:data.receiverId,
    status:data.status['completed']
   })
});
const dbURI= 'mongodb+srv://ahmedmahmoudsaleh269_db_user:TCe4xIcjLNRFzAX8@cluster0.nmnwkir.mongodb.net/?chatApp=Cluster0';
 mongoose.connect(dbURI).then(()=>{
    console.log('Connected to MongoDB Atlas');
})
.catch((error)=>{
    console.error('Error connecting to MongoDB:',error);
 });
 