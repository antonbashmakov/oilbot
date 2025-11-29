import axios from 'axios';

class TelegramService {
  private botToken: string;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    console.log('??????????????BOT TOKEN ',process.env)
    if (!this.botToken) {
      console.warn('TELEGRAM_BOT_TOKEN not configured, skipping Telegram message');
      return;
    }

    try {
      const ret = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      });

      return ret.data;
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      throw new Error(`Failed to send Telegram message: ${error}`);
    }
  }
}

export default TelegramService;
