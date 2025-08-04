const axios = require('axios');
const crypto = require('crypto');

const TERMINAL_KEY = functions.config().tinkoff.terminal_key;
const SECRET_KEY = functions.config().tinkoff.secret_key;

function sign(data) {
  const sortedKeys = Object.keys(data).sort();
  let values = '';
  for (const key of sortedKeys) {
    if (data[key] !== undefined) {
      values += data[key];
    }
  }
  return crypto.createHash('sha256').update(values + SECRET_KEY).digest('hex');
}

async function createPaymentLink(orderId, amount, description, email) {
  const data = {
    TerminalKey: TERMINAL_KEY,
    Amount: Math.round(amount * 100), // kopecks
    OrderId: orderId,
    Description: description,
    PayType: 'S'
  };

  if (email) {
    data.DATA = JSON.stringify({ Email: email });
  }

  data.Sign = sign(data);

  try {
    const response = await axios.post('https://securepay.tinkoff.ru/v2/Init', data);
    if (response.data.Success) {
      return response.data.PaymentURL;
    } else {
      throw new Error(response.data.Details || 'Tinkoff API error');
    }
  } catch (error) {
    console.error('Tinkoff error:', error.message);
    throw error;
  }
}

module.exports = { createPaymentLink };