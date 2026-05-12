const pool = require('../config/db');

// Lazy Stripe initializer — server boots fine without STRIPE_SECRET_KEY
let _stripe = null;
function getStripe() {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key || !key.startsWith('sk_')) {
            throw new Error('STRIPE_SECRET_KEY is not set. Add it to .env or use the /simulate endpoint.');
        }
        _stripe = require('stripe')(key);
    }
    return _stripe;
}

const TIERS = {
    silver: { priceUsd: 9.99,  days: 30, label: 'Silver VIP' },
    gold:   { priceUsd: 29.99, days: 30, label: 'Gold VIP'   },
};

// ── POST /api/subscriptions/checkout ────────────────────────────────────────
// Body: { property_id, tier, currency }
// Creates a Stripe Checkout Session and returns the session URL
exports.createCheckoutSession = async (req, res) => {
    const userId = req.user.userId;
    const { property_id, tier, currency = 'usd' } = req.body;

    if (!TIERS[tier]) return res.status(400).json({ error: 'Invalid tier. Choose silver or gold.' });
    if (!property_id) return res.status(400).json({ error: 'property_id is required.' });

    try {
        const stripe = getStripe(); // throws if key not set

        // Verify property belongs to this user
        const [[prop]] = await pool.query(
            'SELECT property_id, title FROM properties WHERE property_id = ? AND owner_id = ?',
            [property_id, userId]
        );
        if (!prop) return res.status(403).json({ error: 'Property not found or not owned by you.' });

        const tierInfo = TIERS[tier];
        const supportedCurrencies = ['usd', 'eur', 'vnd'];
        const finalCurrency = supportedCurrencies.includes(currency.toLowerCase()) ? currency.toLowerCase() : 'usd';

        let unitAmount;
        if (finalCurrency === 'vnd') {
            const [[rate]] = await pool.query(
                "SELECT rate_to_usd FROM exchange_rates WHERE currency_code = 'VND'"
            );
            const vndRate = rate?.rate_to_usd || 25000;
            unitAmount = Math.round(tierInfo.priceUsd * vndRate);
        } else if (finalCurrency === 'eur') {
            const [[rate]] = await pool.query(
                "SELECT rate_to_usd FROM exchange_rates WHERE currency_code = 'EUR'"
            );
            const eurRate = rate?.rate_to_usd || 0.93;
            unitAmount = Math.round((tierInfo.priceUsd / eurRate) * 100);
        } else {
            unitAmount = Math.round(tierInfo.priceUsd * 100);
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            currency: finalCurrency,
            line_items: [{
                price_data: {
                    currency: finalCurrency,
                    unit_amount: unitAmount,
                    product_data: {
                        name: `${tierInfo.label} — ${prop.title}`,
                        description: `Boost your listing for ${tierInfo.days} days`,
                    },
                },
                quantity: 1,
            }],
            metadata: {
                user_id:     String(userId),
                property_id: String(property_id),
                tier,
            },
            success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url:  `${process.env.FRONTEND_URL}/subscription/cancel`,
        });

        await pool.query(
            `INSERT INTO subscriptions (user_id, property_id, tier, stripe_session_id, amount_usd, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [userId, property_id, tier, session.id, tierInfo.priceUsd]
        );

        res.json({ url: session.url });
    } catch (err) {
        console.error('[Checkout] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// ── POST /api/subscriptions/webhook ─────────────────────────────────────────
// Stripe calls this when a payment is completed
exports.handleWebhook = async (req, res) => {
    const sig  = req.headers['stripe-signature'];
    let event;

    try {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('[Webhook] Signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session  = event.data.object;
        const { user_id, property_id, tier } = session.metadata;
        const tierInfo = TIERS[tier];

        if (!tierInfo) return res.json({ received: true });

        // Activate subscription: update property VIP tier
        const expiresAt = new Date(Date.now() + tierInfo.days * 24 * 60 * 60 * 1000);

        await pool.query(
            `UPDATE properties SET vip_tier = ?, vip_expires_at = ? WHERE property_id = ?`,
            [tier, expiresAt, property_id]
        );

        // Mark subscription as active
        await pool.query(
            `UPDATE subscriptions SET status = 'active', expires_at = ?
             WHERE stripe_session_id = ?`,
            [expiresAt, session.id]
        );

        console.log(`[Subscription] ${tier.toUpperCase()} activated for property #${property_id}`);
    }

    res.json({ received: true });
};

// ── GET /api/subscriptions/mine ──────────────────────────────────────────────
exports.getMySubscriptions = async (req, res) => {
    const userId = req.user.userId;
    const [rows] = await pool.query(
        `SELECT s.*, p.title AS property_title, p.vip_tier, p.vip_expires_at
         FROM subscriptions s
         JOIN properties p ON s.property_id = p.property_id
         WHERE s.user_id = ?
         ORDER BY s.created_at DESC`,
        [userId]
    );
    res.json(rows);
};

// ── POST /api/subscriptions/simulate ────────────────────────────────────────
// DEV ONLY: Simulate a successful payment without Stripe keys
exports.simulatePayment = async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Simulation disabled in production.' });
    }

    const userId = req.user.userId;
    const { property_id, tier } = req.body;
    if (!TIERS[tier]) return res.status(400).json({ error: 'Invalid tier.' });

    const tierInfo = TIERS[tier];
    const expiresAt = new Date(Date.now() + tierInfo.days * 24 * 60 * 60 * 1000);
    const fakeSessionId = `sim_${Date.now()}`;

    await pool.query(
        `UPDATE properties SET vip_tier = ?, vip_expires_at = ? WHERE property_id = ? AND owner_id = ?`,
        [tier, expiresAt, property_id, userId]
    );

    await pool.query(
        `INSERT INTO subscriptions (user_id, property_id, tier, stripe_session_id, amount_usd, status, expires_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?)`,
        [userId, property_id, tier, fakeSessionId, tierInfo.priceUsd, expiresAt]
    );

    res.json({ success: true, message: `${tier} VIP simulated for property #${property_id}`, expires_at: expiresAt });
};
