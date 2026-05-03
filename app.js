const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Messenger Webhook Validation
app.get('/', (req, res) => {
    const VERIFY_TOKEN = "salesbrain_secret_token";
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('SalesBrain AI is Online!');
    }
});

// Event Handling (Messages & Comments)
app.post('/', (req, res) => {
    const body = req.body;
    if (body.object === 'page') {
        body.entry.forEach(entry => {
            // Inbox message handling
            if (entry.messaging) {
                console.log("New Message Received");
            }
            // Comment handling
            if (entry.changes) {
                console.log("New Comment Received");
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Port settings (Render-er jonno eta dorkar)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
