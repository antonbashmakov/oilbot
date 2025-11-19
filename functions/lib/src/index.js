import * as functions from 'firebase-functions';
// Export API function
export const api = functions.region('europe-west1').https.onRequest((req, res) => {
    res.status(200).send('API endpoint');
});
// Optional: Telegram webhook (if you want bot messages)
export const telegramWebhook = functions.https.onRequest((req, res) => {
    res.status(200).send('OK');
});
//# sourceMappingURL=index.js.map