const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
// Key must be exactly 32 bytes for AES-256
const KEY = Buffer.from(
  (process.env.SETTINGS_ENCRYPTION_KEY || 'fitstack_default_key_32chars!!!!!').padEnd(32, '!').slice(0, 32),
  'utf8'
);

/**
 * Encrypt a plaintext string using AES-256-CBC.
 * Returns a string in the format "ivHex:encryptedHex".
 * @param {string} text
 * @returns {string}
 */
function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypt a string previously encrypted with `encrypt`.
 * @param {string} encryptedText  "ivHex:dataHex"
 * @returns {string}
 */
function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  const [ivHex, dataHex] = encryptedText.split(':');
  const iv   = Buffer.from(ivHex,  'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Fields that must be encrypted before storing in GlobalSettings.
 * These fields are NEVER returned in GET responses.
 */
const SENSITIVE_FIELDS = ['password', 'secret', 'apiKey', 'privateKey', 'pass'];

/**
 * Recursively encrypt sensitive fields in a settings value object.
 * @param {object} obj
 * @returns {object}
 */
function encryptSensitiveFields(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      if (typeof result[key] === 'string' && result[key]) {
        result[key] = encrypt(result[key]);
      }
    } else if (typeof result[key] === 'object') {
      result[key] = encryptSensitiveFields(result[key]);
    }
  }
  return result;
}

/**
 * Recursively strip (remove) sensitive fields from a settings value object
 * before returning to the client.
 * @param {object} obj
 * @returns {object}
 */
function stripSensitiveFields(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      delete result[key];
    } else if (typeof result[key] === 'object') {
      result[key] = stripSensitiveFields(result[key]);
    }
  }
  return result;
}

module.exports = { encrypt, decrypt, encryptSensitiveFields, stripSensitiveFields, SENSITIVE_FIELDS };
