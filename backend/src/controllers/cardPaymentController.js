const jwt = require('jsonwebtoken');
const Invoice = require('../models/Invoice');
const SavedCard = require('../models/SavedCard');
const User = require('../models/User');
const payhere = require('../services/payhereService');
const { sendNotification } = require('../services/notificationService');

const buildOrderId = (prefix, userId) => `${prefix}-${userId}-${Date.now()}`;
const extractUserId = (body) =>
  body.custom_1 || String(body.order_id || '').split('-')[1] || null;

const signSessionToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || 'vantrack_lk_default_secret_key', {
    expiresIn: '15m',
  });

const readSessionToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET || 'vantrack_lk_default_secret_key');

const escapeHtml = (value) =>
  String(value == null ? '' : value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });

/**
 * Settle every unpaid/overdue invoice for a parent. Idempotent: invoices that
 * are already paid are ignored, so a duplicate gateway callback is harmless.
 */
const settleOutstandingInvoices = async (parentId, paymentId, io = null) => {
  const outstanding = await Invoice.find({
    parentId,
    status: { $in: ['unpaid', 'overdue'] },
  }).select('_id amount currency invoiceNumber');

  if (outstanding.length === 0) {
    return { settledCount: 0, amount: 0, currency: 'LKR', invoiceIds: [] };
  }

  const invoiceIds = outstanding.map((inv) => inv._id);
  const amount = outstanding.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const currency = outstanding[0].currency || 'LKR';
  const paidAt = new Date();

  await Invoice.updateMany(
    { _id: { $in: invoiceIds } },
    {
      $set: {
        status: 'paid',
        paymentMethod: 'card_online',
        paidAt,
        payherePaymentId: paymentId || '',
      },
    }
  );

  await sendNotification({
    userId: parentId,
    title: '💳 Card Payment Successful',
    message: `Payment of LKR ${amount.toFixed(2)} covering ${outstanding.length} invoice${
      outstanding.length > 1 ? 's' : ''
    } has been received. Your digital receipts are now available.`,
    type: 'payment_receipt',
    data: { invoiceIds: invoiceIds.map((id) => id.toString()), paymentId: paymentId || '' },
    io,
  });

  return { settledCount: outstanding.length, amount, currency, invoiceIds };
};

/** GET /api/invoices/card/saved - the parent's tokenised card, if any. */
exports.getSavedCard = async (req, res) => {
  try {
    const card = await SavedCard.findOne({ parentId: req.user._id });
    res.status(200).json({ success: true, data: card ? card.toSafeJson() : null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** DELETE /api/invoices/card/saved - forget the stored card. */
exports.deleteSavedCard = async (req, res) => {
  try {
    await SavedCard.findOneAndDelete({ parentId: req.user._id });
    res.status(200).json({ success: true, message: 'Saved card removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/invoices/card/tokenise-session
 * Returns a short-lived URL that opens PayHere's secure card page in the
 * device browser so the parent can save (tokenise) a card.
 */
exports.createTokeniseSession = async (req, res) => {
  try {
    const configError = payhere.getConfigError();
    if (configError) {
      return res.status(503).json({ success: false, message: configError });
    }

    const orderId = buildOrderId('CARD', req.user._id.toString());
    const token = signSessionToken({
      purpose: 'card_tokenise',
      userId: req.user._id.toString(),
      orderId,
    });

    const { baseUrl } = payhere.getConfig();
    res.status(200).json({
      success: true,
      data: {
        orderId,
        checkoutUrl: `${baseUrl}/api/invoices/payhere/preapproval/start?t=${encodeURIComponent(token)}`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/invoices/payhere/preapproval/start
 * Renders the self-submitting form that hands the parent to PayHere's secure
 * card entry page. Public - authenticated by the signed `t` query token.
 */
exports.renderPreapprovalPage = async (req, res) => {
  try {
    let session;
    try {
      session = readSessionToken(req.query.t);
    } catch (_) {
      return res
        .status(401)
        .set('Content-Type', 'text/html')
        .send('<h1>This card setup link has expired.</h1><p>Please return to the app and try again.</p>');
    }

    if (session.purpose !== 'card_tokenise') {
      return res.status(400).send('<h1>Invalid card setup request</h1>');
    }

    const configError = payhere.getConfigError();
    if (configError) {
      return res.status(503).set('Content-Type', 'text/html').send(
        `<html><body style="font-family:Arial,sans-serif;text-align:center;padding:40px;background:#fff7ed;">
           <h2 style="color:#c2410c;">Card Payment Not Available</h2>
           <p>${escapeHtml(configError)}</p>
         </body></html>`
      );
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return res.status(404).set('Content-Type', 'text/html').send('<h1>Account not found</h1>');
    }

    const { actionUrl, params } = payhere.buildPreapprovalParams(
      user,
      session.orderId,
      'VanTrack LK - Save card for transport fee payments'
    );

    const hiddenInputs = Object.entries(params)
      .map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`)
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redirecting to PayHere Secure Card Setup...</title>
  <style>
    body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0E2442; color: #fff; }
    .box { text-align: center; padding: 32px; }
    .spinner { border: 4px solid rgba(255,255,255,0.2); border-top-color: #22c55e; border-radius: 50%; width: 48px; height: 48px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { margin: 0 0 8px; }
    p { opacity: 0.8; margin: 0; }
  </style>
</head>
<body>
  <form method="POST" action="${escapeHtml(actionUrl)}" id="payhere-form">
    ${hiddenInputs}
  </form>
  <div class="box">
    <div class="spinner"></div>
    <h2>Connecting to PayHere Secure Card Setup</h2>
    <p>Your card details are entered only on PayHere's secure page.</p>
    <p style="margin-top:16px;font-size:12px;">Not redirected?
      <button type="submit" form="payhere-form" style="background:#22c55e;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold;">Continue</button>
    </p>
  </div>
  <script>document.getElementById('payhere-form').submit();</script>
</body>
</html>`;

    res.status(200).set('Content-Type', 'text/html').send(html);
  } catch (error) {
    res.status(500).set('Content-Type', 'text/html').send(`<h1>Card setup failed</h1><p>${escapeHtml(error.message)}</p>`);
  }
};

/**
 * POST /api/invoices/payhere/preapproval/notify
 * PayHere server callback carrying the encrypted customer token.
 */
exports.payHerePreapprovalNotify = async (req, res) => {
  try {
    const body = req.body || {};
    const signatureValid = payhere.verifyNotifySignature(body);

    if (!signatureValid) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('[PayHere Preapproval] Rejected notification with invalid signature', body.order_id);
        return res.status(400).send('Invalid signature');
      }
      console.warn('[PayHere Preapproval] Signature mismatch ignored in non-production mode', body.order_id);
    }

    const userId = extractUserId(body);
    if (!userId) {
      return res.status(400).send('Missing customer reference');
    }

    if (payhere.isSuccessStatus(body.status_code)) {
      const customerToken = body.customer_token;
      if (!customerToken) {
        console.warn('[PayHere Preapproval] Success without customer_token', body.order_id);
        return res.status(200).send('OK');
      }

      await SavedCard.findOneAndUpdate(
        { parentId: userId },
        {
          parentId: userId,
          customerToken,
          method: body.method || '',
          cardHolderName: body.card_holder_name || '',
          maskedCardNumber: body.card_no || '',
          cardExpiry: body.card_expiry || '',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[PayHere Preapproval] Card saved for parent ${userId}`);
    } else {
      console.warn(
        `[PayHere Preapproval] Non-success status ${body.status_code} for ${body.order_id}: ${body.status_message || ''}`
      );
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('[PayHere Preapproval Error]', error);
    res.status(500).send('Internal Server Error');
  }
};

/** GET /api/invoices/payhere/preapproval/return - shown after card setup. */
exports.payHerePreapprovalReturn = (req, res) => {
  res.status(200).set('Content-Type', 'text/html').send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Card Saved</title>
<style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0fdf4;}
.card{background:#fff;border-radius:16px;padding:32px;max-width:420px;width:90%;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.1);}
.icon{width:64px;height:64px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;}
h2{color:#16a34a;margin:0 0 8px;}p{color:#475569;margin:4px 0;}</style></head>
<body><div class="card"><div class="icon">✅</div><h2>Card Saved Securely</h2>
<p>Your card has been stored by PayHere for future payments.</p>
<p style="font-size:12px;color:#94a3b8;margin-top:16px;">Return to the VanTrack LK app and tap "Pay Full Outstanding".</p>
</div></body></html>`);
};

/** GET /api/invoices/payhere/preapproval/cancel - card setup was cancelled. */
exports.payHerePreapprovalCancel = (req, res) => {
  res.status(200).set('Content-Type', 'text/html').send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Card Setup Cancelled</title>
<style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fef2f2;}
.card{background:#fff;border-radius:16px;padding:32px;max-width:420px;width:90%;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.1);}
.icon{width:64px;height:64px;border-radius:50%;background:#fee2e2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;}
h2{color:#dc2626;margin:0 0 8px;}p{color:#475569;margin:4px 0;}</style></head>
<body><div class="card"><div class="icon">❌</div><h2>Card Setup Cancelled</h2>
<p>No card was saved and no charge was made.</p>
<p style="font-size:12px;color:#94a3b8;margin-top:16px;">You can close this window and try again in the app.</p>
</div></body></html>`);
};

/**
 * POST /api/invoices/card/pay-outstanding
 * Charges the saved card for the full outstanding balance and settles every
 * covered invoice on success.
 */
exports.payOutstandingByCard = async (req, res) => {
  try {
    const configError = payhere.getConfigError();
    if (configError) {
      return res.status(503).json({ success: false, message: configError });
    }

    const card = await SavedCard.findOne({ parentId: req.user._id });
    if (!card) {
      return res.status(400).json({
        success: false,
        message: 'No saved card found. Please add a card before paying.',
      });
    }

    const cardJson = card.toSafeJson();
    if (cardJson.isExpired) {
      return res.status(400).json({
        success: false,
        message: 'Your saved card has expired. Please update your card details.',
      });
    }

    const outstanding = await Invoice.find({
      parentId: req.user._id,
      status: { $in: ['unpaid', 'overdue'] },
    }).select('_id amount currency');

    if (outstanding.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You have no outstanding balance to pay.',
      });
    }

    const amount = outstanding.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    const currency = outstanding[0].currency || payhere.getConfig().currency;
    const orderId = buildOrderId('OUT', req.user._id.toString());

    let gatewayResult;
    try {
      gatewayResult = await payhere.chargeSavedCard({
        orderId,
        amount,
        currency,
        items: `VanTrack LK Outstanding Transport Fees (${outstanding.length} invoice${
          outstanding.length > 1 ? 's' : ''
        })`,
        customerToken: card.customerToken,
        custom1: req.user._id.toString(),
        notifyUrl: `${payhere.getConfig().baseUrl}/api/invoices/payhere/charge-notify`,
      });
    } catch (gatewayError) {
      return res.status(502).json({
        success: false,
        message: `Payment gateway error: ${gatewayError.message}`,
      });
    }

    const data = gatewayResult.data || {};
    const statusCode = data.status_code;

    if (payhere.isSuccessStatus(statusCode)) {
      const settlement = await settleOutstandingInvoices(req.user._id, data.payment_id, req.app.get('io'));
      return res.status(200).json({
        success: true,
        message: `Payment of ${currency} ${amount.toFixed(2)} received successfully.`,
        data: {
          orderId,
          paymentId: data.payment_id || '',
          amount,
          currency,
          statusCode,
          statusMessage: data.status_message || 'Successfully completed the tokenised payment.',
          settledCount: settlement.settledCount,
        },
      });
    }

    return res.status(402).json({
      success: false,
      status: payhere.describeStatus(statusCode),
      message: data.status_message || gatewayResult.msg || 'The payment was not completed.',
      data: { orderId, statusCode },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/invoices/payhere/charge-notify
 * Async callback for Charging API payments. Confirms settlement when the
 * synchronous response was only "pending".
 */
exports.payHereChargeNotify = async (req, res) => {
  try {
    const body = req.body || {};
    const signatureValid = payhere.verifyNotifySignature(body);

    if (!signatureValid && process.env.NODE_ENV === 'production') {
      console.warn('[PayHere Charge Notify] Rejected notification with invalid signature', body.order_id);
      return res.status(400).send('Invalid signature');
    }

    if (payhere.isSuccessStatus(body.status_code)) {
      const userId = extractUserId(body);
      if (userId) {
        const settlement = await settleOutstandingInvoices(userId, body.payment_id, req.app.get('io'));
        console.log(
          `[PayHere Charge Notify] Settled ${settlement.settledCount} invoice(s) for parent ${userId}`
        );
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('[PayHere Charge Notify Error]', error);
    res.status(500).send('Internal Server Error');
  }
};
