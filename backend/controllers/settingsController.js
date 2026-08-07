const { getSetting, setSetting } = require('../models/GlobalSettings');
const { encryptSensitiveFields, stripSensitiveFields } = require('../utils/encryptSettings');
const { withAudit } = require('../utils/withAudit');
const crypto = require('crypto');

// ── Get settings by key ────────────────────────────────────────────────────────
const getSettings = async (req, res, next) => {
  try {
    const { key } = req.params;
    const setting = await getSetting(key);
    if (!setting) return res.json({ success: true, data: null });

    // Strip sensitive fields before returning to client
    const safe = { ...setting, value: stripSensitiveFields(setting.value) };
    res.json({ success: true, data: safe });
  } catch (err) { next(err); }
};

// ── Get all settings (all keys) ────────────────────────────────────────────────
const getAllSettings = async (req, res, next) => {
  try {
    const GlobalSettings = require('../models/GlobalSettings');
    const all = await GlobalSettings.find().lean();
    const safe = all.map(s => ({ ...s, value: stripSensitiveFields(s.value) }));
    res.json({ success: true, data: safe });
  } catch (err) { next(err); }
};

// ── Update settings ────────────────────────────────────────────────────────────
const updateSettings = async (req, res, next) => {
  try {
    const { key } = req.params;
    const rawValue = req.body.value;

    const encrypted = encryptSensitiveFields(rawValue);

    await withAudit(req, 'UPDATE_SETTINGS', 'Setting', null, async () => {
      await setSetting(key, encrypted, req.user._id);
    }, { targetName: key, description: `Updated settings: ${key}` });

    const updated = await getSetting(key);
    res.json({ success: true, data: { ...updated, value: stripSensitiveFields(updated.value) } });
  } catch (err) { next(err); }
};

// ── Test SMTP connection ───────────────────────────────────────────────────────
const testSmtp = async (req, res, next) => {
  try {
    const setting = await getSetting('smtp');
    if (!setting?.value) return res.status(400).json({ success: false, message: 'SMTP not configured' });

    const nodemailer = require('nodemailer');
    const { host, port, user } = setting.value;

    const transporter = nodemailer.createTransport({
      host, port: Number(port) || 587,
      auth: { user, pass: 'placeholder' }, // pass is encrypted, test only connectivity
    });

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 9000)
    );

    await Promise.race([transporter.verify(), timeout]);
    res.json({ success: true, message: 'SMTP connection successful' });
  } catch (err) {
    if (err.message === 'timeout') return res.status(408).json({ success: false, message: 'SMTP connection timed out' });
    res.json({ success: false, message: `SMTP connection failed: ${err.message}` });
  }
};

// ── Create API key ─────────────────────────────────────────────────────────────
const createApiKey = async (req, res, next) => {
  try {
    const { label = 'API Key' } = req.body;
    const plaintext = `fsk_${crypto.randomBytes(24).toString('hex')}`;
    const hash      = crypto.createHash('sha256').update(plaintext).digest('hex');

    const setting = await getSetting('api_keys') || { value: [] };
    const keys    = Array.isArray(setting.value) ? setting.value : [];

    keys.push({ id: crypto.randomUUID(), label, hash, createdAt: new Date(), isActive: true });
    await setSetting('api_keys', keys, req.user._id);

    // Return plaintext ONCE — never again
    res.status(201).json({
      success: true,
      message: 'API key created. Copy it now — it will not be shown again.',
      data: { plaintext, label },
    });
  } catch (err) { next(err); }
};

// ── Revoke API key ─────────────────────────────────────────────────────────────
const revokeApiKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const setting = await getSetting('api_keys');
    if (!setting?.value) return res.status(404).json({ success: false, message: 'No API keys found' });

    const keys = setting.value.map(k => k.id === id ? { ...k, isActive: false } : k);
    await setSetting('api_keys', keys, req.user._id);

    res.json({ success: true, message: 'API key revoked' });
  } catch (err) { next(err); }
};

module.exports = { getSettings, getAllSettings, updateSettings, testSmtp, createApiKey, revokeApiKey };
