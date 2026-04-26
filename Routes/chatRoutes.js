const express = require('express');
const Protect = require('../Middlewares.js/authMiddlewares');
const {accessChat,fetchChats,fetchGroups,createGroup,addSelftoGroup, fetchChatSec, deleteMessage, exitGroup, requestJoinGroup, acceptJoinRequest, rejectJoinRequest} = require('../Controller/chatController')
const Router = express.Router();
Router.route('/access').post(Protect,accessChat);
Router.route('/fetch').get(Protect,fetchChats);
Router.route('/createGroup').post(Protect,createGroup);
Router.route('/fetchGroup').get(Protect,fetchGroups);
Router.route('/joinGroup').put(Protect,addSelftoGroup);
Router.route('/requestJoinGroup').put(Protect,requestJoinGroup);
Router.route('/acceptJoinRequest').put(Protect,acceptJoinRequest);
Router.route('/rejectJoinRequest').put(Protect,rejectJoinRequest);
Router.route('/fetch/:chatId').get(Protect,fetchChatSec)
Router.route('/delete/:chat_id').delete(Protect,deleteMessage)
Router.route('/exit/:chat_id').get(Protect,exitGroup)
//Router.route('/exitGroup').post(Protect,exitGroup);
module.exports = Router;