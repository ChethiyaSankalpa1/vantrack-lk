const crypto = require('crypto');

/**
 * PayHere gateway helpers for tokenised (saved-card) payments.
 *
 * Card data never reaches this server. The flow is:
 *   1. Preapproval API - the parent enters their card on PayHere's own secure
 *      page; PayHere returns an encrypted `customer_token` (plus the masked
 *      card number, brand and expiry) to our notify_url.
 *   2. Charging API    - we charge that token on demand for the outstanding
 *      amount via a server-to-server REST call.
 *
 * Docs:
 *   https://support.payhere.lk/api-&-mobile-sdk/preapproval-api
 *   https://support.payhere.lk/api-&-mobile-sdk/charging-api
 */

const SANDBOX_HOST = 'https://sandbox.payhere.lk';
const LIVE_HOST = 'https://www.payhere.lk';

const md5Upper = (value) =>
  crypto.createHash('md5').update(String(value)).digest('hex').toUpperCase();

/**
 * Resolve gateway host + mode. Sandbox is the safe default, and a
 * sandbox-looking merchant id always forces sandbox so live credentials can
 * never accidentally be paired with test data.
 */
const resolveMode = () => {
  const merchantId = String(process.env.PAYHERE_MERCHANT_ID || '');
  const requestedLive = (process.env.PAYHERE_MODE || 'sandbox').toLowerCase() === 'live';
  const looksLikeSandboxId = /^12[1-3]\d{4,}$/.test(merchantId);
  const sandbox = !requestedLive || looksLikeSandboxId;
  return { sandbox, host: sandbox ? SANDBOX_HOST : LIVE_HOST };
};

const getConfig = () => {
  const { sandbox, host } = resolveMode();
  return {
    sandbox,
    host,
    merchantId: process.env.PAYHERE_MERCHANT_ID,
    merchantSecret: process.env.PAYHERE_SECRET,
    appId: process.env.PAYHERE_APP_ID,
    appSecret: process.env.PAYHERE_APP_SECRET,
    currency: process.env.PAYHERE_CURRENCY || 'LKR',
    baseUrl: (process.env.APP_BASE_URL || 'https://vantrack-lk.onrender.com').replace(/\/+$/, ''),
  };
};

/**
 * Returns a human readable reason when tokenised card payments cannot run,
 * or null when the gateway is fully configured.
 */
const getConfigError = () => {
  const cfg = getConfig();
  if (!cfg.merchantId || !cfg.merchantSecret) {
    return 'PayHere is not configured. Set PAYHERE_MERCHANT_ID and PAYHERE_SECRET on the server.';
  }
  if (cfg.merchantId === '1234567' || cfg.merchantSecret === 'secret123') {
    return 'PayHere credentials are placeholders. Set real PAYHERE_MERCHANT_ID and PAYHERE_SECRET.';
  }
  if (!cfg.appId || !cfg.appSecret) {
    return (
      'PayHere card charging is not enabled. Set PAYHERE_APP_ID and PAYHERE_APP_SECRET ' +
      '(create an API key with the "Automated Charging API" permission).'
    );
  }
  return null;
};

/** Hash for the Checkout / Preapproval form. */
const buildOrderHash = (merchantId, orderId, amount, currency, merchantSecret) =>
  md5Upper(merchantId + orderId + amount + currency + md5Upper(merchantSecret));

/** MD5 signature used by PayHere webhooks (includes status_code). */
const buildNotifySignature = (merchantId, orderId, payhereAmount, currency, statusCode, merchantSecret) =>
  md5Upper(
    merchantId + orderId + payhereAmount + currency + statusCode + md5Upper(merchantSecret)
  );

const formatAmount = (value) => Number(value).toFixed(2);

/** PayHere requires a placeholder amount when a card is tokenised with no charge. */
const tokenisePlaceholderAmount = (currency) => (currency === 'LKR' ? '10.00' : '0.51');

/** Build the auto-submitting preapproval form payload for a parent. */
const buildPreapprovalParams = (user, orderId, items) => {
  const cfg = getConfig();
  const amount = tokenisePlaceholderAmount(cfg.currency);
  const nameParts = String(user.name || 'Valued Parent').trim().split(/\s+/);
  const firstName = nameParts.shift() || 'Parent';
  const lastName = nameParts.join(' ') || 'Customer';

  return {
    sandbox: cfg.sandbox,
    actionUrl: `${cfg.host}/pay/preapprove`,
    params: {
      merchant_id: cfg.merchantId,
      return_url: `${cfg.baseUrl}/api/invoices/payhere/preapproval/return`,
      cancel_url: `${cfg.baseUrl}/api/invoices/payhere/preapproval/cancel`,
      notify_url: `${cfg.baseUrl}/api/invoices/payhere/preapproval/notify`,
      order_id: orderId,
      items,
      currency: cfg.currency,
      amount,
      first_name: firstName,
      last_name: lastName,
      email: user.email || 'parent@vantrack.lk',
      phone: user.phone || '+94771234567',
      address: user.address || 'Sri Lanka',
      city: 'Colombo',
      country: 'Sri Lanka',
      custom_1: String(user._id),
      hash: buildOrderHash(cfg.merchantId, orderId, amount, cfg.currency, cfg.merchantSecret),
    },
  };
};

/** Verify a PayHere webhook signature. */
const verifyNotifySignature = (body) => {
  const cfg = getConfig();
  if (!cfg.merchantSecret || !body) return false;
  const expected = buildNotifySignature(
    body.merchant_id,
    body.order_id,
    body.payhere_amount,
    body.payhere_currency,
    body.status_code,
    cfg.merchantSecret
  );
  return expected === String(body.md5sig || '').toUpperCase();
};

let cachedAccessToken = null; // { value, expiresAt }

/** Retrieve (and cache) a PayHere Merchant API OAuth access token. */
const getAccessToken = async () => {
  const cfg = getConfig();
  if (!cfg.appId || !cfg.appSecret) {
    throw new Error(getConfigError() || 'PayHere merchant API credentials are missing.');
  }
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 15000) {
    return cachedAccessToken.value;
  }

  const basicAuth = Buffer.from(`${cfg.appId}:${cfg.appSecret}`).toString('base64');
  const response = await fetch(`${cfg.host}/merchant/v1/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = null;
  }

  if (!response.ok || !json || !json.access_token) {
    const reason = (json && (json.error_description || json.error)) || text || response.status;
    throw new Error(`PayHere authentication failed: ${reason}`);
  }

  cachedAccessToken = {
    value: json.access_token,
    expiresAt: Date.now() + (Number(json.expires_in) || 599) * 1000,
  };
  return cachedAccessToken.value;
};

/**
 * Charge a previously tokenised card for the given amount.
 * Returns the PayHere response body: { status, msg, data }.
 */
const chargeSavedCard = async ({ orderId, amount, currency, items, customerToken, custom1, notifyUrl }) => {
  const cfg = getConfig();
  const accessToken = await getAccessToken();

  const payload = {
    type: 'PAYMENT',
    order_id: orderId,
    items,
    currency,
    amount: Number(formatAmount(amount)),
    customer_token: customerToken,
    custom_1: custom1,
    notify_url: notifyUrl,
  };

  const response = await fetch(`${cfg.host}/merchant/v1/payment/charge`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = null;
  }

  if (!json) {
    throw new Error(`PayHere charge failed with status ${response.status}: ${text || 'no response body'}`);
  }

  if (json.error) {
    // Force a fresh token next time if the cached one was rejected.
    if (json.error === 'invalid_token') cachedAccessToken = null;
    throw new Error(`PayHere charge rejected: ${json.error_description || json.error}`);
  }

  return json;
};

/** Map a PayHere status_code to a stable, user-facing status word. */
const describeStatus = (statusCode) => {
  switch (String(statusCode)) {
    case '2':
      return 'success';
    case '0':
      return 'pending';
    case '-1':
      return 'cancelled';
    case '-2':
      return 'failed';
    default:
      return 'unknown';
  }
};

/** True when the gateway responded with status_code 2 (success). */
const isSuccessStatus = (statusCode) => String(statusCode) === '2';

module.exports = {
  getConfig,
  getConfigError,
  buildOrderHash,
  buildNotifySignature,
  buildPreapprovalParams,
  verifyNotifySignature,
  getAccessToken,
  chargeSavedCard,
  describeStatus,
  isSuccessStatus,
  formatAmount,
};
