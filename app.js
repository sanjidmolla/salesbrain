const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();

app.use(bodyParser.json());

// Apnar deya Token ekhane bosiye diyechi
const PAGE_ACCESS_TOKEN = "EAASg8xC8QY0BRYyTQZBdIcrfFcUzJFkuzX9IwT8qkDGDgnMafsss1n1hrE71VW5ZBOe2jBGNKdhGjqipEy9SYGzgMuZC9lW0areXQxldUv5VgPp8rJ5mLZASS7Vkdl8PZBPeeRJES7BU1Rs3YLJrnNOWfxrgeMQOdXoWb6aaylZC8O4bEbC6a67SUVLZCasbNvMwe5nzpR80vcQsUORFkywGZBSycAZDZD"; 
const VERIFY_TOKEN = "salesbrain_secret_token";

// Webhook Validation
app.get('/', (req, res) => {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('SalesBrain AI is Online!');
    }
});

// Event Handling
app.post('/', (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            // Messenger Inbox Handling
            if (entry.messaging) {
                entry.messaging.forEach(event => {
                    if (event.message && event.message.text) {
                        const senderPsid = event.sender.id;
                        console.log("Message received from:", senderPsid);
                        sendMessengerReply(senderPsid, "Alhamdulillah! SalesBrain AI active hoyeche. Ami apnar message peyechi.");
                    }
                });
            }
            // Comment Handling
            if (entry.changes) {
                entry.changes.forEach(change => {
                    if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                        const commentId = change.value.comment_id;
                        console.log("Comment received ID:", commentId);
                        sendCommentReply(commentId, "Dhonno bad comment korar jonno! Amra khub shiggori apnar shathe jogajog korbo.");
                    }
                });
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Function to send Messenger Reply
async function sendMessengerReply(psid, text) {
    try {
        await axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: psid },
            message: { text: text }
        });
        console.log("Reply sent successfully!");
    } catch (error) {
        console.error("Error sending message:", error.response ? error.response.data : error.message);
    }
}

// Function to send Comment Reply
async function sendCommentReply(commentId, text) {
    try {
        await axios.post(`https://graph.facebook.com/v21.0/${commentId}/comments?access_token=${PAGE_ACCESS_TOKEN}`, {
            message: text
        });
        console.log("Comment reply sent!");
    } catch (error) {
        console.error("Error sending comment:", error.response ? error.response.data : error.message);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
