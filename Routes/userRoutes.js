const express = require('express');
const Router = express.Router();
const Protect = require('..//Middlewares.js/authMiddlewares');
const {loginController, registerController, fetchAllUserController} = require('../Controller/userController')

Router.post('/login', loginController);
Router.post('/register', registerController);
Router.get('/fetchUsers', Protect, fetchAllUserController )

module.exports = Router;