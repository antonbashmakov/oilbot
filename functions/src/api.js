const express = require('express');
const cors = require('cors');

const { db } = require('./db');
const { createPaymentLink } = require('./tinkoff');
const { sendPaymentLink } = require('./bot');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const MEMBERSHIP_FEE = 500; // RUB

// Helper: Get user by Telegram ID
async function getUser(telegramId) {
  const userDoc = await db.collection('users').doc(telegramId).get();
  if (userDoc.exists) {
    const data = userDoc.data();
    return { id: userDoc.id, ...data };
  }
  return null;
}

// Helper: Upsert user
async function upsertUser(telegramId, userData) {
  await db.collection('users').doc(telegramId).set(userData, { merge: true });
}

// POST /start-checkout
app.post('/start-checkout', async (req, res) => {
  const { telegramUserId, firstName, lastName, email, cart, agreeToTerms } = req.body;

  if (!telegramUserId || !cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  // Calculate cart total
  const amount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let finalAmount = amount;
  let description = 'Purchase in Web Shop';
  let needsMembership = false;

  const user = await getUser(telegramUserId);

  if (!user) {
    // New user (first purchase) → add membership
    needsMembership = true;
    finalAmount += MEMBERSHIP_FEE;
    description = 'First purchase with membership';
  } else if (!user.isMember) {
    // Existing user, not a member → check if has past orders
    const pastOrders = await db.collection('orders')
      .where('userId', '==', telegramUserId)
      .get();

    if (pastOrders.size > 0) {
      // Not first purchase → must pay membership
      if (!agreeToTerms) {
        return res.status(400).json({ error: 'You must agree to the terms to proceed.' });
      }
      needsMembership = true;
      finalAmount += MEMBERSHIP_FEE;
      description = 'Renew membership and purchase';
    } else {
      // First purchase, no extra fee
      description = 'First purchase';
    }
  }

  // Create order
  const orderId = `order_${Date.now()}_${telegramUserId}`;
  const orderData = {
    userId: telegramUserId,
    items: cart,
    totalAmount: amount,
    membershipFee: needsMembership ? MEMBERSHIP_FEE : 0,
    finalAmount,
    status: 'pending',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    orderId
  };

  await db.collection('orders').doc(orderId).set(orderData);

  // Update user
  await upsertUser(telegramUserId, {
    firstName,
    lastName,
    email,
    isMember: true,
    joinedAt: user?.joinedAt || admin.firestore.FieldValue.serverTimestamp(),
    lastOrder: admin.firestore.FieldValue.serverTimestamp()
  });

  // Save agreement if needed
  if (needsMembership && agreeToTerms) {
    await db.collection('agreements').add({
      userId: telegramUserId,
      orderId,
      agreedAt: admin.firestore.FieldValue.serverTimestamp(),
      termsVersion: 'v1'
    });
  }

  // Generate payment link
  try {
    const paymentUrl = await createPaymentLink(
      orderId,
      finalAmount,
      description,
      email
    );

    // Send via Telegram (optional)
    await sendPaymentLink(telegramUserId, paymentUrl);

    res.json({ paymentUrl, orderId });
  } catch (error) {
    console.error('Payment link error:', error);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

// GET /user/:telegramId/orders
app.get('/user/:telegramId/orders', async (req, res) => {
  const { telegramId } = req.params;
  try {
    const snapshot = await db.collection('orders')
      .where('userId', '==', telegramId)
      .orderBy('timestamp', 'desc')
      .get();

    const orders = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      data.timestamp = data.timestamp?.toDate().toISOString();
      orders.push({ id: doc.id, ...data });
    });

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /order/:orderId
app.get('/order/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const doc = await db.collection('orders').doc(orderId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const data = doc.data();
    data.timestamp = data.timestamp?.toDate().toISOString();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = app;