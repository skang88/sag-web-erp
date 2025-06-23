// utils/telegramUtils.js
const axios = require('axios'); // axios 라이브러리 설치 필요: npm install axios

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

exports.sendTelegramMessage = async (message) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('Telegram bot token or chat ID is not configured. Skipping Telegram message.');
        return;
    }

    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
        await axios.post(telegramApiUrl, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'MarkdownV2', // 서식을 위해 MarkdownV2 사용
            disable_notification: false, // 메시지 수신 시 알림 활성화 (true로 하면 무음 알림)
        });
        console.log('Telegram message sent successfully!');
    } catch (error) {
        console.error('Failed to send Telegram message:', error.response ? error.response.data : error.message);
    }
};