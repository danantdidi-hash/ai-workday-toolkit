const Stripe = require('stripe');
const crypto = require('crypto');

const SESSION_HOURS = 24; // how long a login stays valid

exports.handler = async (event) => {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    console.error('login error: SESSION_SECRET is not set');
    return respond(500, 'Server misconfigured. Please try again later.');
  }

  // Accept email from a POSTed form (application/x-www-form-urlencoded) or JSON
  let email = '';
  try {
    const contentType = (event.headers['content-type'] || '').toLowerCase();
    if (contentType.includes('application/json')) {
      email = (JSON.parse(event.body || '{}').email || '');
    } else {
      const params = new URLSearchParams(event.body || '');
      email = params.get('email') || '';
    }
  } catch (e) {
    email = '';
  }
  email = email.trim().toLowerCase();

  if (!email) {
    return redirectToLogin('missing_email');
  }

  try {
    const customers = await stripe.customers.list({ email, limit: 5 });
    let hasActive = false;

    for (const customer of customers.data) {
      const active = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 1 });
      if (active.data.length > 0) { hasActive = true; break; }
      const trialing = await stripe.subscriptions.list({ customer: customer.id, status: 'trialing', limit: 1 });
      if (trialing.data.length > 0) { hasActive = true; break; }
    }

    if (!hasActive) {
      return redirectToLogin('no_membership');
    }

    const token = makeToken(email, secret);

    return {
      statusCode: 302,
      multiValueHeaders: {
