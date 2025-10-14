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

module.exports = {
    getUpcomingShipments,
};
