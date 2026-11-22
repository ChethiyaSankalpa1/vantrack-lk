const mongoose = require('mongoose');

/**
 * A tokenised card on file for a parent.
 *
 * Only PayHere's encrypted `customerToken` and the non-sensitive display
 * metadata PayHere returns (brand, masked number, expiry) are stored. Raw card
 * numbers and CVV values are never received or persisted.
 */
const savedCardSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    customerToken: {
      type: String,
      required: true,
    },
    method: {
      type: String, // VISA | MASTER | AMEX ...
      default: '',
    },
    cardHolderName: {
      type: String,
      default: '',
    },
    maskedCardNumber: {
      type: String, // e.g. ************4564
      default: '',
    },
    cardExpiry: {
      type: String, // MMYY as sent by PayHere
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

/** Safe representation for API responses - never exposes the token itself. */
savedCardSchema.methods.toSafeJson = function toSafeJson() {
  return {
    id: this._id.toString(),
    method: this.method,
    cardHolderName: this.cardHolderName,
    maskedCardNumber: this.maskedCardNumber,
    cardExpiry: this.cardExpiry,
    isExpired: isExpired(this.cardExpiry),
    savedAt: this.updatedAt || this.createdAt,
  };
};

/** MMYY expiry in the past? Empty/unknown expiry is treated as not expired. */
function isExpired(cardExpiry) {
  const value = String(cardExpiry || '');
  if (value.length !== 4 || !/^\d{4}$/.test(value)) return false;
  const month = parseInt(value.slice(0, 2), 10);
  const year = 2000 + parseInt(value.slice(2), 10);
  if (month < 1 || month > 12) return false;
  // A card is valid through the last day of its expiry month.
  const expiryEnd = new Date(year, month, 1);
  return Date.now() >= expiryEnd.getTime();
}

const SavedCard = mongoose.model('SavedCard', savedCardSchema);
SavedCard.isExpired = isExpired;

module.exports = SavedCard;
