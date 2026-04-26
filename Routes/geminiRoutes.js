const express = require('express');
const handleGemini = require('../Controller/gemini');
const Router = express.Router();
Router.route('/Gemini').post(handleGemini);
module.exports = Router;