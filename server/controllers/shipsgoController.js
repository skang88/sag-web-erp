const axios = require('axios');

const getUpcomingShipments = async (req, res) => {
    const apiToken = '0b016f39-df3d-4060-acdd-56f8d7c7fe86';
    // To get a broader range of upcoming shipments, we filter for SAILING, LOADED, or BOOKED statuses.
    const apiUrl = 'https://api.shipsgo.com/v2/ocean/shipments?filters[status]=in:SAILING,LOADED,BOOKED&order_by=date_of_discharge,asc';

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'X-Shipsgo-User-Token': apiToken,
                'Accept': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching from ShipsGo API:', error.response ? error.response.data : error.message);
        res.status(error.response ? error.response.status : 500).json({
            message: 'Failed to fetch shipments from ShipsGo API',
            error: error.response ? error.response.data : error.message
        });
    }
};

const handleWebhook = async (req, res) => {
    console.log('Received ShipsGo Webhook:');
    console.log(JSON.stringify(req.body, null, 2));

    const slackWebhookUrl = process.env.SHIPSGO_SLACK_WEBHOOK_URL;
    if (!slackWebhookUrl) {
        console.error('SHIPSGO_SLACK_WEBHOOK_URL is not set.');
        return res.status(500).send('Webhook processor configuration error.');
    }
    
    const { event_type, data } = req.body;

    let message;
    if (event_type === 'TEST') {
        message = `ShipsGo Webhook Test:\n\`\`\`${JSON.stringify(data, null, 2)}\`\`\``;
    } else {
        // Here you can format the message for other event types
        message = `New ShipsGo Event: ${event_type}\n\`\`\`${JSON.stringify(data, null, 2)}\`\`\``;
    }

    try {
        await axios.post(slackWebhookUrl, { text: message });
        console.log('Slack message sent successfully!');
    } catch (error) {
        console.error('Failed to send Slack message:', error.response ? error.response.data : error.message);
    }

    res.status(200).send('Webhook received');
};

module.exports = {
    getUpcomingShipments,
    handleWebhook,
};
