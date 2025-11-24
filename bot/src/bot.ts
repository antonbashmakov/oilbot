import TelegramBot from 'node-telegram-bot-api';
import { getCustomer, getItems } from './services/repository';
import { Item } from './models/models';

import * as dotenv from 'dotenv';
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in the environment variables');
}

const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  if (text === '/start') {
    const meatCommand = 'showItems={"type":"MEAT"}';
    const encodedCommand = Buffer.from(meatCommand).toString('base64');
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Meat',
              url: `https://t.me/PoSebestoiosti_test_bot?start=${encodedCommand}`
            }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, 'Welcome! Click the button below to see meat items:', keyboard);
    return;
  }

  if (text.startsWith('/start ')) {
    const payload = text.split(' ')[1];
    if (payload) {
      try {
        const decodedCommand = Buffer.from(payload, 'base64').toString('utf8');
        const match = decodedCommand.match(/^showItems=({.*})$/);

        if (match && match[1]) {
          const params = JSON.parse(match[1]);
          if (params.type && ['MEAT', 'SEA', 'CHEESE'].includes(params.type)) {
            const items = await getItems(params.type);
            if (items.length > 0) {
              const message = items.map(formatItemMessage).join('\n');
              bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            } else {
              bot.sendMessage(chatId, 'No items found for this category.');
            }
            return;
          }
        }
      } catch (error) {
        console.error('Error decoding payload:', error);
        bot.sendMessage(chatId, 'Invalid payload.');
        return;
      }
    }
  }

  const customer = await getCustomer(chatId);
  if (customer) {
    bot.sendMessage(chatId, `Welcome back, ${customer.first_name}!`);
  } else {
    bot.sendMessage(chatId, 'Welcome! It seems you are a new user.');
  }
});

const formatItemMessage = (item: Item): string => {
  const link = item.link || (item && item.link);
  const addToCartCommand = `addToCart={\"id\":${item.id}}`;
  const encodedCommand = Buffer.from(addToCartCommand).toString('base64');
  
  const linkPart = link ? `[Посмотреть 👀](${link}) ` : '';
  const cartPart = `[В корзину 🛒](https://t.me/PoSebstoimostiBot?start=${encodedCommand})`;

  return `*${item.name}* : \`${item.description} ${item.fraction} ${item.unit} ${item.fraction_price_out}₽\`
      ${linkPart}${cartPart}`;
};

export default bot;
