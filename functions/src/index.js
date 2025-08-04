const functions = require('firebase-functions');
const app = require('./api');

// Export API function
exports.api = functions.region('europe-west1').https.onRequest(app);

// Optional: Telegram webhook (if you want bot messages)
exports.telegramWebhook = functions.https.onRequest((req, res) => {
  res.status(200).send('OK');
});