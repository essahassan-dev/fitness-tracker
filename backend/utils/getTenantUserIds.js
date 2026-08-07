const Business = require('../models/Business');
const User = require('../models/User');

/**
 * Returns an array of all User _ids belonging to a Business tenant.
 *
 * Includes:
 *   - The Business's adminUser _id
 *   - All Users whose businessId matches the Business _id
 *
 * Returns an empty array (never throws) when:
 *   - businessId is null / undefined / not a valid ObjectId
 *   - No Business document is found for the given businessId
 *
 * @param {string|import('mongoose').Types.ObjectId} businessId
 * @returns {Promise<import('mongoose').Types.ObjectId[]>}
 */
async function getTenantUserIds(businessId) {
  if (!businessId) return [];

  try {
    // 1. Resolve the Business document to get its adminUser _id
    const biz = await Business.findById(businessId).select('adminUser');
    if (!biz) return [];

    // 2. Find all Users (trainers + end-users) whose businessId field points
    //    to this Business.  The businessId field is an additive field on User
    //    (default: null) populated when an admin creates members.
    const members = await User.find({ businessId }).select('_id');

    // 3. Combine: admin first, then all members
    return [biz.adminUser, ...members.map((u) => u._id)];
  } catch (_err) {
    // Invalid ObjectId format or unexpected DB error — return empty array
    // so callers always get a safe, filterable set rather than an exception.
    return [];
  }
}

module.exports = { getTenantUserIds };
