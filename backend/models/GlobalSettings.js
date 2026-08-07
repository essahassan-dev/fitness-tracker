const mongoose = require('mongoose');

const VALID_KEYS = [
  'branding',
  'smtp',
  'fcm',
  'stripe',
  'paypal',
  'google_oauth',
  'languages',
  'currencies',
  'timezone',
  'maintenance',
  'security',
  'api_keys',
  'email_templates',
  'backup',
];

const globalSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Setting key is required'],
      unique: true,
      enum: {
        values: VALID_KEYS,
        message: 'Invalid settings key: {VALUE}',
      },
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast singleton look-ups by key (unique already creates one)

const GlobalSettings = mongoose.model('GlobalSettings', globalSettingsSchema);

/**
 * Retrieve a single settings document by key.
 * Returns null when the key has never been set.
 *
 * @param {string} key - One of the VALID_KEYS values
 * @returns {Promise<object|null>}
 */
async function getSetting(key) {
  return GlobalSettings.findOne({ key }).lean();
}

/**
 * Upsert a settings document by key.
 * Creates the document if it does not exist, updates it otherwise.
 *
 * @param {string} key    - One of the VALID_KEYS values
 * @param {*}      value  - The new value (any serialisable type)
 * @param {string} userId - ObjectId of the super_admin performing the update
 * @returns {Promise<object>} The updated document
 */
async function setSetting(key, value, userId) {
  return GlobalSettings.findOneAndUpdate(
    { key },
    { $set: { value, updatedBy: userId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
}

module.exports = GlobalSettings;
module.exports.getSetting = getSetting;
module.exports.setSetting = setSetting;
module.exports.VALID_KEYS = VALID_KEYS;
