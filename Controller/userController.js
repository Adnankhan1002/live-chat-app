const UserModel = require("../Models/userModel")
const generateToken = require('../config/JwtToken')
const expressAsyncHandler = require('express-async-handler')
const loginController = expressAsyncHandler(async (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ message: "Name and password are required" });
    }

    const normalizedName = name.trim();
    const user = await UserModel.findOne({ name: normalizedName });

    if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    return res.status(200).json({
        id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
    });
});

const registerController = expressAsyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await UserModel.findOne({
        $or: [{ email: normalizedEmail }, { name: normalizedName }],
    });

    if (existingUser) {
        if (existingUser.email === normalizedEmail) {
            return res.status(409).json({ message: "User already exists with this email" });
        }
        return res.status(409).json({ message: "Username is already taken" });
    }

    const user = await UserModel.create({
        name: normalizedName,
        email: normalizedEmail,
        password,
    });

    return res.status(201).json({
        id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
    });
});

const fetchAllUserController = expressAsyncHandler(async(req,res)=>{
    const keyword = (req.query.search ? {
        $or : [
            {name : {$regex : req.query.search , $options : 'i'}},
            {email : {$regex : req.query.search , $options : 'i'}},
        ],

    } : {} );
    const users = await UserModel.find(keyword).find({
        _id : {$ne : req.user._id},
    });
    res.send(users);


})
module.exports = {loginController, registerController,fetchAllUserController}