const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(bodyParser.json());

// Render-এর Environment Variable থেকে এপিআই কি নেওয়া
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const PAGE_ACCESS_TOKEN = "EAASg8xC8QY0BRccokGNvbLELZBkxaTi159nYi0rFm9xZBDkooyA7bTQuHzwrdMrHQgw9jyVe6fNhU62ZCvYdZBsmCWlmIdfT4pJLsrt2bzGdscIWZCQEj0tte0ios49qfOcnxDVOKUPgN3ViZCfPoOYpKDArBxYhNpwsO9Ro3F7h2QC8iu8FYKwYZCZBtSQllCBy1ovnZBZB9ERNZBmTI5WbinlO1cWLQZDZD";
const VERIFY_TOKEN = "salesbrain_secret_token";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Webhook Validation
app.get('/', (req, res) => {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('DoharMart AI is Online!');
    }
});

app.post('/', async (req, res) => {
    const body = req.body;
    if (body.object === 'page') {
        for (const entry of body.entry) {
            if (entry.messaging) {
                for (const event of entry.messaging) {
                    if (event.message && event.message.text) {
                        const senderPsid = event.sender.id;
                        const userMessage = event.message.text;
                        const aiResponse = await getGeminiResponse(userMessage);
                        await sendMessengerReply(senderPsid, aiResponse);
                    }
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    }
});

async function getGeminiResponse(prompt) {
    try {
        // মডেলের নাম 'models/' সহ লিখে দেখা হচ্ছে
        const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

        const systemInstruction = `
        Tumi "DoharMart" online e-commerce-er salesman. 
        Amader delivery shudhu Dhaka-r Dohar-e hoy. 
        Delivery charge 50 taka. 
        Phone: 01540401099.
        Customer jodi Banglay lekhe, tumi Banglay uttor dabe.
        `;

        const result = await model.generateContent(systemInstruction + "\nUser: " + prompt);
        const response = await result.response;
        return response.text(); 
    } catch (error) {
        console.error("DEBUG Gemini Error:", error.message);
        return "Sorry, call us at 01540401099";
    }
}

async function sendMessengerReply(psid, text) {
    try {
        await axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: psid },
            message: { text: text }
        });
    } catch (e) {
        console.error("FB API Error:", e.message);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
