const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(bodyParser.json());

// --- CONFIGURATION ---
const PAGE_ACCESS_TOKEN = "EAASg8xC8QY0BRYyTQZBdIcrfFcUzJFkuzX9IwT8qkDGDgnMafsss1n1hrE71VW5ZBOe2jBGNKdhGjqipEy9SYGzgMuZC9lW0areXQxldUv5VgPp8rJ5mLZASS7Vkdl8PZBPeeRJES7BU1Rs3YLJrnNOWfxrgeMQOdXoWb6aaylZC8O4bEbC6a67SUVLZCasbNvMwe5nzpR80vcQsUORFkywGZBSycAZDZD";
const VERIFY_TOKEN = "salesbrain_secret_token";
const GEMINI_API_KEY = "AIzaSyBuvWGwqAwfVZh67mtOCdcYcHJ-PxGs4Mo"; 

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Webhook Validation
app.get('/', (req, res) => {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('SalesBrain AI is Online and Ready!');
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

                        // AI theke response neya
                        const aiResponse = await getGeminiResponse(userMessage);
                        await sendMessengerReply(senderPsid, aiResponse);
                    }
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    }
});

// AI ট্রেনিং এবং রেসপন্স ফাংশন
async function getGeminiResponse(prompt) {
    try {
        const systemInstruction = `
        Tumi DoharMart-er ekjon expert ebong bondhushulob salesman. 
        DoharMart Dhaka-r Dohar area-te delivery dey. 
        Amader ponno: Poultry feed, macher khabar, ebong agro products. 
        Kotha bolar niyom: 
        1. Sob somoy 'Slam/Nomoshkar' diye kotha shuru korbe. 
        2. Khub shorol ebong shudho Banglay kotha bolbe. 
        3. Jodi kono damer kotha jiggesha kore kintu tumi na jano, tahole bolbe "Amader admin ekhon-i apnake exact dam-ti janabe".
        4. Customer-ke bolbe amra Dohar-er bhetore khub druto delivery dei.
        `;

        const result = await model.generateContent(systemInstruction + "\nUser Question: " + prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Dhonnobad apnar message-er jonno. Amader representative khub shiggori jogajog korbe.";
    }
}

async function sendMessengerReply(psid, text) {
    try {
        await axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: psid },
            message: { text: text }
        });
    } catch (e) {
        console.error("FB Send Error:", e.response ? e.response.data : e.message);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
