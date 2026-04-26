const express = require('express');
const dotenv = require("dotenv");
const {default : mongoose} = require("mongoose")
const userRoutes = require('./Routes/userRoutes')
const chatRoutes = require('./Routes/chatRoutes')
const messageRoutes = require('./Routes/messageRoutes');
const geminiRoutes = require('./Routes/geminiRoutes')
const cors = require('cors')
const bodyParser = require("body-parser");
const app = express();
const {Server} = require("socket.io");
const {createServer} = require("http");
const server = createServer(app);
const io = new Server(server, {
    cors: {
      origin: "*", // or specify your frontend URL
      methods: ["GET", "POST"],
    },
  });

dotenv.config();
app.use(express.json())
app.use(bodyParser.json())

const connectDb = async()=>{
    try{
        const connect = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: `)

    }
    catch(err){
        console.log(err);
    }
   
}
connectDb();
const PORT = process.env.PORT 
app.use(cors());

app.set("io", io);

app.get('/', (req,res)=>{

    res.send('API IS RUNNING PROPERLY');
    
});

app.use('/user', userRoutes);
app.use('/chat',chatRoutes);
app.use('/message',messageRoutes);
app.use('/api',geminiRoutes)

io.on("connection",(socket)=>{
    console.log("Client connected");
    console.log(socket.id);

    // IMPORTANT: Users join a room with their own ID so we can send them private events
    socket.on("setup", (userId) => {
        socket.join(userId.toString());
        console.log("User personal setup room joined: ", userId);
    });
   
socket.on("join chat",(chat_id)=>{
        if (!chat_id) {
            return;
        }

        socket.join(chat_id.toString());
        console.log('socket joined the chat :',chat_id);
})

socket.on("leave chat", (chat_id) => {
        if (!chat_id) {
            return;
        }

        socket.leave(chat_id.toString());
        console.log('socket left the chat :', chat_id);
})

    socket.on("disconnect",()=>{
        console.log("Client disconnected ",socket.id);
    });
    socket.on("new message", (data) => {
        if (!data || !data.chat || !data.chat.users) {
           return console.log("Missing chat/users in message data");
        }

        // Emit to all users in the chat, except the sender
        const senderId = data.sender._id || data.sender;
        data.chat.users.forEach((user) => {
            const userId = user._id || user;
            if (userId.toString() === senderId.toString()) return; 

            // Sending to personal room
            socket.to(userId.toString()).emit("recv-message", data);
        });
    })

    // WebRTC Signaling for Video/Audio Calls
    socket.on("offer", (data) => {
        console.log("Offer received for room:", data.roomId);
        socket.to(data.roomId.toString()).emit("offer", data);
    });

    socket.on("answer", (data) => {
        console.log("Answer received for room:", data.roomId);
        socket.to(data.roomId.toString()).emit("answer", data.answer);
    });

    socket.on("ice-candidate", (data) => {
        socket.to(data.roomId.toString()).emit("ice-candidate", data.candidate);
    });

    socket.on("reject-call", (data) => {
        console.log("Call rejected in room:", data.roomId);
        socket.to(data.roomId.toString()).emit("call-rejected");
    });
})


 server.listen(PORT,()=>{
    console.log(`server is running`)
});



