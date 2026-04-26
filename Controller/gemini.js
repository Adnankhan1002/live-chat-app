const { GoogleGenerativeAI } = require("@google/generative-ai");
const handleGemini=async(req,res)=>{
    const genAI = new GoogleGenerativeAI("AIzaSyBM4uX1KkH38ICAbG-JQqSgfNZooRujNmw");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = req.body.content;

const result = await model.generateContent(prompt);
console.log(result.response.text());
res.json(result.response.text())

}
module.exports = handleGemini;