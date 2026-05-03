const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(bodyParser.json());

// --- CONFIGURATION ---
const PAGE_ACCESS_TOKEN = "EAASg8xC8QY0BRccokGNvbLELZBkxaTi159nYi0rFm9xZBDkooyA7bTQuHzwrdMrHQgw9jyVe6fNhU62ZCvYdZBsmCWlmIdfT4pJLsrt2bzGdscIWZCQEj0tte0ios49qfOcnxDVOKUPgN3ViZCfPoOYpKDArBxYhNpwsO9Ro3F7h2QC8iu8FYKwYZCZBtSQllCBy1ovnZBZB9ERNZBmTI5WbinlO1cWLQZDZD";
const VERIFY_TOKEN = "salesbrain_secret_token";
const GEMINI_API_KEY = "AIzaSyBuvWGwqAwfVZh67mtOCdcYcHJ-PxGs4Mo"; 

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Webhook Validation
app.get('/', (req, res) => {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('DoharMart AI is Online and Running!');
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

                        // AI থেকে রেসপন্স নেওয়া
                        const aiResponse = await getGeminiResponse(userMessage);
                        await sendMessengerReply(senderPsid, aiResponse);
                    }
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    }
});

// AI ট্রেনিং এবং রেসপন্স ফাংশন (Language Adaptive)
async function getGeminiResponse(prompt) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

        const systemInstruction = `
        Tumi "DoharMart" e-commerce-er ekjon expert salesman. 
        Amader prothan tortho:
        1. Amra sudhu Dhaka-r Dohar area-te Home Delivery kori. 
        2. Delivery charge fix 50 taka. 
        3. Amader Phone Number: 01540401099.
        4. Amra online e-commerce platform. 
        
        Language Rules:
        - Customer jodi Banglay lekhe, tumi shudho Banglay uttor dabe.
        - Customer jodi English-e lekhe, tumi English-e uttor dabe.
        - Customer jodi Banglish-e (Jemon: kemon achen) lekhe, tumi Banglish-e bondhushulob uttor dabe.
        
        Kotha bolar style: Sob somoy polite thakbe ebong customer-ke help korar chesta korbe.
        `;

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
