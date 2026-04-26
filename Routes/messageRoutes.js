const express = require('express');
const {allMessages,createMessage} = require('../Controller/messageController')
const Protect = require('../Middlewares.js/authMiddlewares');
const Router = express.Router();
Router.route('/:chatId').get(Protect,allMessages);
Router.route('/').post(Protect,createMessage);

module.exports = Router;