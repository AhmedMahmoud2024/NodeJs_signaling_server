const model = require('../config/gemini');

exports.chatWithAI=async (req,res) =>{
    try{
        const {prompt}= req.body;
        const chat= model.startChat({
            history:[
                {
                    role:"user",
                    parts:[{text: 'lets start conversation'}]
                }
            ]
        });
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        res.json({text:response.text()});
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({error: 'AI Chat Error'});
    }
}