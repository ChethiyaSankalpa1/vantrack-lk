const test = require('node:test');
const assert = require('node:assert/strict');

const payhere = require('../src/services/payhereService');
const SavedCard = require('../src/models/SavedCard');

const ENV_KEYS = ['PAYHERE_MERCHANT_ID', 'PAYHERE_SECRET', 'PAYHERE_APP_ID', 'PAYHERE_APP_SECRET', 'PAYHERE_CURRENCY'];
const LIVE_SECRET = 'vantrack-live-secret';

const setEnv = (overrides = {}) => {
  const base = {
    PAYHERE_MERCHANT_ID: '9999999',
    PAYHERE_SECRET: LIVE_SECRET,
    PAYHERE_APP_ID: 'app-id',
    PAYHERE_APP_SECRET: 'app-secret',
    PAYHERE_CURRENCY: 'LKR',
    ...overrides,
  };
  Object.entries(base).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
};

test.beforeEach(() => setEnv());
test.after(() => ENV_KEYS.forEach((key) => delete process.env[key]));

test('buildOrderHash produces the documented MD5 order hash', () => {
  assert.equal(
    payhere.buildOrderHash('1234567', 'ORDER-1', '1000.00', 'LKR', 'secret123'),
    'E947DB3546C2DD348A0C2A97927FB675'
  );
});

test('buildNotifySignature includes status_code in the signature', () => {
  assert.equal(
    payhere.buildNotifySignature('1234567', 'ORDER-1', '1000.00', 'LKR', '2', 'secret123'),
    'B05B882D7A429FB44EAFAEF6C74390E8'
  );
});

test('verifyNotifySignature accepts a matching md5sig and rejects tampering', () => {
  setEnv({ PAYHERE_SECRET: 'secret123' });
  const body = {
    merchant_id: '1234567',
    order_id: 'ORDER-1',
    payhere_amount: '1000.00',
    payhere_currency: 'LKR',
    status_code: '2',
    md5sig: 'b05b882d7a429fb44eafaef6c74390e8', // lower-case must still match
  };
  assert.equal(payhere.verifyNotifySignature(body), true);
  assert.equal(payhere.verifyNotifySignature({ ...body, payhere_amount: '9999.00' }), false);
  assert.equal(payhere.verifyNotifySignature({ ...body, md5sig: '' }), false);
});

test('describeStatus maps PayHere status codes to stable words', () => {
  assert.equal(payhere.describeStatus('2'), 'success');
  assert.equal(payhere.describeStatus(2), 'success');
  assert.equal(payhere.describeStatus('0'), 'pending');
  assert.equal(payhere.describeStatus('-1'), 'cancelled');
  assert.equal(payhere.describeStatus('-2'), 'failed');
  assert.equal(payhere.describeStatus('99'), 'unknown');
});

test('isSuccessStatus is true only for status_code 2', () => {
  assert.equal(payhere.isSuccessStatus('2'), true);
  assert.equal(payhere.isSuccessStatus('0'), false);
  assert.equal(payhere.isSuccessStatus('-2'), false);
  assert.equal(payhere.isSuccessStatus(undefined), false);
});

test('formatAmount always renders two decimals', () => {
  assert.equal(payhere.formatAmount(15000), '15000.00');
  assert.equal(payhere.formatAmount(99.5), '99.50');
});

test('getConfigError reports missing merchant credentials', () => {
  setEnv({ PAYHERE_MERCHANT_ID: undefined, PAYHERE_SECRET: undefined });
  assert.match(payhere.getConfigError(), /not configured/i);
});

test('getConfigError reports placeholder credentials', () => {
  setEnv({ PAYHERE_MERCHANT_ID: '1234567', PAYHERE_SECRET: 'secret123' });
  assert.match(payhere.getConfigError(), /placeholder/i);
});

test('getConfigError reports missing charging API credentials', () => {
  setEnv({ PAYHERE_APP_ID: undefined, PAYHERE_APP_SECRET: undefined });
  assert.match(payhere.getConfigError(), /charging is not enabled/i);
});

test('getConfigError returns null when the gateway is fully configured', () => {
  assert.equal(payhere.getConfigError(), null);
});

test('buildPreapprovalParams tokenises a card with the LKR placeholder amount', () => {
  const { sandbox, actionUrl, params } = payhere.buildPreapprovalParams(
    { _id: 'user-1', name: 'Kasun Jayawardena', email: 'kasun@example.lk', phone: '+94771234567' },
    'CARD-user-1-1',
    'VanTrack LK - Save card'
  );

  assert.equal(sandbox, true);
  assert.match(actionUrl, /\/pay\/preapprove$/);
  assert.equal(params.amount, '10.00');
  assert.equal(params.merchant_id, '9999999');
  assert.equal(params.custom_1, 'user-1');
  assert.equal(params.first_name, 'Kasun');
  assert.equal(params.last_name, 'Jayawardena');
  assert.match(params.notify_url, /\/api\/invoices\/payhere\/preapproval\/notify$/);
  // The form hash must be derived from exactly the submitted fields.
  assert.equal(
    params.hash,
    payhere.buildOrderHash(
      params.merchant_id,
      params.order_id,
      params.amount,
      params.currency,
      process.env.PAYHERE_SECRET
    )
  );
});

test('SavedCard.isExpired validates the stored card expiry (MMYY)', () => {
  assert.equal(SavedCard.isExpired('0120'), true); // Jan 2020 - in the past
  assert.equal(SavedCard.isExpired('1299'), false); // Dec 2099 - far future
  assert.equal(SavedCard.isExpired(''), false); // unknown expiry is not treated as expired
  assert.equal(SavedCard.isExpired(undefined), false);
  assert.equal(SavedCard.isExpired('abcd'), false);
});

test('SavedCard.toSafeJson never exposes the raw customer token', () => {
  const card = new SavedCard({
    parentId: '65f000000000000000000001',
    customerToken: 'SUPER-SECRET-TOKEN',
    method: 'VISA',
    cardHolderName: 'Kasun Jayawardena',
    maskedCardNumber: '************4564',
    cardExpiry: '1299',
  });

  const json = card.toSafeJson();
  assert.equal(json.customerToken, undefined);
  assert.equal(json.method, 'VISA');
  assert.equal(json.maskedCardNumber, '************4564');
  assert.equal(json.isExpired, false);
  assert.equal(JSON.stringify(json).includes('SUPER-SECRET-TOKEN'), false);
});
