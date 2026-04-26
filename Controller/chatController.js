const asyncHandler = require("express-async-handler");
const Chat = require("../Models/chatModel");
const User = require("../Models/userModel");
const Message = require('../Models/messageModel')
const accessChat = asyncHandler(async(req,res)=>{
  console.log(req.body)
  console.log(req.body.userId)
    const userId = req.body.userId;
    
   
   if(!userId){
    console.log('params not send with req')
    res.sendStatus(400)
   }
  var isChat = await(Chat.find({
    isGroupChat : false,
    $and:[
      {users:{$elemMatch : {$eq : req.user._id}}},
      {users:{$elemMatch : {$eq : userId}}},
    ]

  })).populate('users','-password').populate('latestMessage');
  
  isChat = await(User.populate(isChat,{
    path:'latestMessage.sender',
    select:'name email'
  }));
  if(isChat.length > 0){
    res.json(isChat[0]);
    console.log(isChat[0]);
  }
  else{
    try{
      const newChat = await Chat.create({
        chatName : 'sender',
        users :[req.user._id, userId],
        isGroupChat : false,
      })
      const fullChat = Chat.findOne({
        _id : newChat._id,

      }).populate('users', '-password');
      res.json(fullChat);
      

    }
    catch{
     
      console.log('error')
    }
  }



});
const fetchChats = async(req,res)=>{
  const userId = req.user._id;
  try{
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("latestMessage")
    .sort({ updatedAt: -1 })
    .then(async (results) => {
      results = await User.populate(results, {
        path: "latestMessage.sender",
        select: "name email",
      });
     
      res.status(200).send(results);
    });
  }
  catch(error){
    res.status(400);
    throw new Error(error);
  }
  
  

}
const fetchGroups = asyncHandler(async (req, res) => {
  try {
    const allGroups = await Chat.find({ isGroupChat: true })
      .populate("groupAdmin", "name email")
      .populate("users", "name email").populate("joinRequests", "name email");
    console.log(allGroups);
    res.status(200).send(allGroups);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});
const createGroup = async(req,res)=>{
  console.log(req.body);
  console.log("String being parsed:", req.body.users)
  console.log(req.body.users)
 
  if(!req.body.users || !req.body.name){
    return res.status(400).send({message : 'data is not sufficient'})
  }
  try{
    try {
     var userInfo= JSON.stringify(req.body.users);
     var users = JSON.parse(userInfo);
    } catch (error) {
      console.error("JSON Parsing Error: ", error.message);
      console.error("Input Data: ", req.body.users);
    }
    
  console.log('users', users);
  users.push(req.user);

  }catch(error){
    console.log(error);
    return res.status(400).json({ error: "Invalid users data provided" });

  }
  
  try{
    const newGroup = await Chat.create({
      chatName : req.body.name,
      isGroupChat : true,
      users : users,
      groupAdmin : req.user,
    })
    
    console.log(newGroup)
    const fullGroupChat = await Chat.findOne({ _id: newGroup._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);

  }catch(error){
    res.status(401).send(error.message)

  }
  
}

const addSelftoGroup = async(req,res)=>{
  try {
    
    const  groupId  = req.body.groupId;
    console.log(groupId)
    const userId = req.user._id; // Extracted from JWT via `protect` middleware
    console.log(userId)

    const group = await Chat.findById(groupId);
    console.log(group)
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if user is already a member (ObjectId-safe comparison)
    const isAlreadyMember = group.users.some(
      (memberId) => memberId.toString() === userId.toString()
    );
    if (isAlreadyMember) {
      return res.status(400).json({ message: "Already a member" });
      
    }

    // Add user to members list
    group.users.push(userId);
    await group.save();
   
    console.log("group is joined",group)
    

    res.json({ message: "Joined group successfully", group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }



}
const fetchChatSec = async(req,res)=>{
  try {
    const chat = await Chat.findById(req.params.chatId).populate("users", "name email").populate("joinRequests", "name email");

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}
const deleteMessage = async (req, res) => {
  try {
      const { chat_id } = req.params;
      console.log(chat_id);
      const deletedChat = await Chat.findByIdAndDelete(chat_id);
      console.log(deletedChat)
      
      if (!deletedChat) {
          return res.status(404).json({ message: "Message not found" });
      }

      res.json({ message: "Message deleted successfully" });
  } catch (error) {
      res.status(500).json({ error: "Server error" });
  }
}

const exitGroup = async(req,res)=>{
  try{
   
    const {chat_id} = req.params;
    const userId = req.user._id;
    console.log(userId);
    const group = await Chat.findById(chat_id).populate("users", "name email").populate("joinRequests", "name email");
    if(!group) return res.status(404).json({message: "Group not found"}
    );
   
    const index = group.users.findIndex(user => user._id.toString() === userId.toString());
    console.log(index)
    if(index === -1) return res.status(404).json({message: "User not found"});
    group.users.splice(index, 1);
    await group.save();
    res.json({message: "User exited group successfully", group});

  }
  catch(err){
    res.status(500).json({message: "Server error", error: err});
  }
}

const requestJoinGroup = async (req, res) => {
  try {
    const { chatId } = req.body;
    const userId = req.user._id;

    const group = await Chat.findById(chatId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if user is already a member
    const isAlreadyMember = group.users.some(
      (memberId) => memberId.toString() === userId.toString()
    );
    if (isAlreadyMember) {
      return res.status(400).json({ message: "Already a member" });
    }

    // Check if user already requested
    const hasRequested = group.joinRequests.some(
      (memberId) => memberId.toString() === userId.toString()
    );
    if (hasRequested) {
      return res.status(400).json({ message: "Join request already sent" });
    }

    group.joinRequests.push(userId);
    await group.save();
    
    const updatedGroup = await Chat.findById(chatId).populate("joinRequests", "name email").populate("users", "name email").populate("groupAdmin", "name email");

    const io = req.app.get("io");
    if(io) {
      // Notify the group admin that there is a new request
      io.to(updatedGroup.groupAdmin._id.toString()).emit("group-updated", {
        groupId: chatId,
        groupName: updatedGroup.chatName,
        type: "NEW_REQUEST"
      });
    }

    res.json({ message: "Join request sent", group: updatedGroup });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

const acceptJoinRequest = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const adminId = req.user._id;

    const group = await Chat.findById(chatId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.groupAdmin.toString() !== adminId.toString()) {
      return res.status(403).json({ message: "Only admin can accept requests" });
    }

    // Remove from requests, add to users
    group.joinRequests = group.joinRequests.filter(
      (reqId) => reqId.toString() !== userId.toString()
    );
    
    const isAlreadyMember = group.users.some(
      (memberId) => memberId.toString() === userId.toString()
    );
    if (!isAlreadyMember) {
      group.users.push(userId);
    }
    
    await group.save();
    
    const updatedGroup = await Chat.findById(chatId).populate("joinRequests", "name email").populate("users", "name email").populate("groupAdmin", "name email");
    
    // Emit event to the user who requested so their UI updates
    const io = req.app.get("io");
    if(io) {
      io.to(userId.toString()).emit("group-updated", {
        groupId: chatId,
        groupName: updatedGroup.chatName,
        type: "JOIN_ACCEPTED"
      });
      // Emit to existing room members so their participant string/number updates
      io.to(chatId.toString()).emit("group-updated", {
         groupId: chatId,
         type: "MEMBER_ADDED"
      });
    }

    res.json({ message: "User added to group", group: updatedGroup });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

const rejectJoinRequest = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const adminId = req.user._id;

    const group = await Chat.findById(chatId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.groupAdmin.toString() !== adminId.toString()) {
      return res.status(403).json({ message: "Only admin can reject requests" });
    }

    // Remove from requests
    group.joinRequests = group.joinRequests.filter(
      (reqId) => reqId.toString() !== userId.toString()
    );
    
    await group.save();
    
    const updatedGroup = await Chat.findById(chatId).populate("joinRequests", "name email").populate("users", "name email").populate("groupAdmin", "name email");

    const io = req.app.get("io");
    if(io) {
      io.to(userId.toString()).emit("group-updated", {
        groupId: chatId,
        groupName: updatedGroup.chatName,
        type: "JOIN_REJECTED"
      });
    }

    res.json({ message: "Join request rejected", group: updatedGroup });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

module.exports = {
  accessChat,
  fetchChats,
  fetchGroups,
  createGroup,
  addSelftoGroup,
  fetchChatSec,
  deleteMessage,
  exitGroup,
  requestJoinGroup,
  acceptJoinRequest,
  rejectJoinRequest
};
