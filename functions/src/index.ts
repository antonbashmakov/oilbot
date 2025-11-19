import * as functions from 'firebase-functions';
import { Request, Response } from 'express';

// Export API function
export const api = functions.region('europe-west1').https.onRequest((req: Request, res: Response) => {
  res.status(200).send('API endpoint');
});

// Optional: Telegram webhook (if you want bot messages)
export const telegramWebhook = functions.https.onRequest((req: Request, res: Response) => {
  res.status(200).send('OK');
});
