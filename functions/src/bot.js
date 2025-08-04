const axios = require('axios');

const TELEGRAM_TOKEN = functions.config().telegram.token;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

async function sendPaymentLink(telegramUserId, paymentUrl) {
  const text = `💳 Complete your payment:\n${paymentUrl}`;
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: telegramUserId,
      text: text,
      reply_markup: {
        inline_keyboard: [
          [{ text: "Pay Now", url: paymentUrl }]
        ]
      }
    });
  } catch (error) {
    console.error('Telegram send error:', error.message);
  }
}

module.exports = { sendPaymentLink };