const Chat = require('../Models/chatModel')
const Message = require('../Models/messageModel');
const User = require('../Models/userModel');
const allMessages = async(req,res)=>{
   
    try{
        const messages = await Message.find({chat: req.params.chatId}) .populate("sender", "name email")
        .populate("reciever")
        .populate("chat");
        
        res.json(messages);

    }
    catch(error){
        res.status(400);
        throw new Error(error.message);

    }  
}

const createMessage = async(req,res)=>{
    console.log("it is called yes")
    const {text,chatId} = req.body;
    console.log("text is ",text);
    if(!text || !chatId){
        return res.status(400).json({error:'Please enter both text and chatId'});
    }
    try{
        var message = await Message.create({message:text,chat:chatId,sender:req.user._id})
       
    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await message.populate("reciever");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name email",
    });
    
    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message, updatedAt: Date.now() });
   
   console.log(message);
    res.json(message);

    
}
catch(error){
    console.log(error);



}
}
module.exports = {allMessages,createMessage};
