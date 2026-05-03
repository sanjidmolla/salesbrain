const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(bodyParser.json());

// --- CONFIGURATION ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const PAGE_ACCESS_TOKEN = "EAASg8xC8QY0BRccokGNvbLELZBkxaTi159nYi0rFm9xZBDkooyA7bTQuHzwrdMrHQgw9jyVe6fNhU62ZCvYdZBsmCWlmIdfT4pJLsrt2bzGdscIWZCQEj0tte0ios49qfOcnxDVOKUPgN3ViZCfPoOYpKDArBxYhNpwsO9Ro3F7h2QC8iu8FYKwYZCZBtSQllCBy1ovnZBZB9ERNZBmTI5WbinlO1cWLQZDZD";
const VERIFY_TOKEN = "salesbrain_secret_token";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Webhook Validation
app.get('/', (req, res) => {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('DoharMart AI is Online and Secure!');
    }
});

// Event Handling
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

// AI ট্রেনিং এবং রেসপন্স ফাংশন (Updated per Chatbots suggestions)
async function getGeminiResponse(prompt) {
    try {
        // মডেলের নাম পরিবর্তন করে 'gemini-1.5-flash-latest' করা হয়েছে
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash-latest" 
        });

        const systemInstruction = `
        Tumi "DoharMart" e-commerce-er salesman. 
        Amader info:
        1. Sudhu Dhaka-r Dohar-e Home Delivery kori. 
        2. Delivery charge fix 50 taka. 
        3. Phone Number: 01540401099.
        4. Polite thakbe ebong customer-ke help korbe.
        `;

        // generateContent call করার সময় v1 ব্যবহার হবে ডিফল্টভাবে লেটেস্ট লাইব্রেরিতে
        const result = await model.generateContent(systemInstruction + "\nUser Message: " + prompt);
        const response = await result.response;
        return response.text(); 
    } catch (error) {
        console.error("DEBUG Gemini Error:", error.message);
        return "Sorry, ektu somossya hochche. Please amader call korun: 01540401099";
    }
}

async function sendMessengerReply(psid, text) {
    try {
        await axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: psid },
            message: { text: text }
        });
    } catch (e) {
        console.error("FB API Error:", e.response ? e.response.data : e.message);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
