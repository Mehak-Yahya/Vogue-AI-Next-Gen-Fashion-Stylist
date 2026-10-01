const express = require('express');
const Stripe = require('stripe');
const { requireAuth } = require('../middleware/requireAuth');
const User = require('../models/User');

const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

router.post('/create-checkout-session', requireAuth, async (req, res) => {
  if (!stripe || !process.env.STRIPE_PRICE_ID || !process.env.CLIENT_URL) {
    return res.status(503).json({ error: 'Billing is not configured yet.' });
  }

  const requestKey = req.get('Idempotency-Key') || '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) {
    return res.status(400).json({ error: 'A valid checkout idempotency key is required.' });
  }

  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: 'User account was not found.' });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: user.email,
      metadata: { userId: user._id.toString() },
      subscription_data: { metadata: { userId: user._id.toString() } },
      success_url: `${process.env.CLIENT_URL}/wardrobe?subscription=success`,
      cancel_url: `${process.env.CLIENT_URL}/wardrobe?subscription=cancelled`,
    }, {
      idempotencyKey: `checkout:${user._id.toString()}:${requestKey}`,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout Error:', error.message);
    return res.status(500).json({ error: 'Unable to start checkout.' });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.sendStatus(503);

  let event;
  try {
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  const subscription = event.data.object;
  if (['checkout.session.completed', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
    const userId = event.type === 'checkout.session.completed'
      ? subscription.metadata?.userId
      : subscription.metadata?.userId;
    const status = event.type === 'checkout.session.completed'
      ? 'active'
      : event.type === 'customer.subscription.deleted' || subscription.status !== 'active'
        ? 'inactive'
        : 'active';
    if (userId) await User.findByIdAndUpdate(userId, { $set: { 'profile.subscriptionStatus': status } });
  }

  return res.json({ received: true });
});

module.exports = router;