/**
 * Utility functions for computing student performance trends and flags.
 */

export const RATING_ORDINALS = {
  'Need Support': 1,
  'Average': 2,
  'Good': 3,
  'Outstanding': 4
};

/**
 * Compute the performance trend for a student.
 * @param {Array} entries - Historical entries for the student (sorted by week asc).
 * @returns {string} - 'Improving', 'Declining', 'Consistent', 'Variable', 'Recovering', or 'New'.
 */
export const computeTrend = (entries) => {
  if (!entries || entries.length < 3) return 'New';

  const ordinals = entries.map(e => RATING_ORDINALS[e.rating] || 0);
  const last3 = ordinals.slice(-3);

  // Recovering: Was Need Support, now Good or above
  const wasNeedSupport = ordinals.slice(0, -1).some(o => o === 1);
  const nowGoodOrAbove = last3[2] >= 3;
  if (wasNeedSupport && nowGoodOrAbove) return 'Recovering';

  if (last3[2] > last3[1] && last3[1] > last3[0]) return 'Improving';
  if (last3[2] < last3[1] && last3[1] < last3[0]) return 'Declining';
  if (last3[0] === last3[1] && last3[1] === last3[2]) return 'Consistent';

  return 'Variable';
};

/**
 * Detect performance flags for a student.
 * @param {Array} entries - Historical entries for the student (sorted by week asc).
 * @returns {Array<string>} - Array of active flags.
 */
export const detectFlags = (entries) => {
  if (!entries || entries.length === 0) return ['New'];
  
  const flags = [];
  const ordinals = entries.map(e => RATING_ORDINALS[e.rating] || 0);
  const latest = ordinals[ordinals.length - 1];
  const previous = ordinals[ordinals.length - 2];

  if (entries.length < 3) flags.push('New');

  // Need Support: 2+ consecutive weeks rated Average (2) or Need Support (1)
  if (ordinals.length >= 2) {
    const last2 = ordinals.slice(-2);
    if (last2.every(o => o <= 2)) flags.push('Need Support');
  }

  // Star Student: 2+ consecutive weeks rated Outstanding (4)
  if (ordinals.length >= 2) {
    const last2 = ordinals.slice(-2);
    if (last2.every(o => o === 4)) flags.push('Star Student');
  }

  // Inconsistent: Ratings jump 2+ ordinal points
  if (ordinals.length >= 2) {
    const diff = Math.abs(latest - previous);
    if (diff >= 2) flags.push('Inconsistent');
  }

  // Recovering: Previous = Need Support (1), Current = Good (3) or Outstanding (4)
  if (ordinals.length >= 2) {
    if (previous === 1 && latest >= 3) flags.push('Recovering');
  }

  return [...new Set(flags)];
};

/**
 * Get current week's rating display.
 */
export const getCurrentRating = (entries, currentWeek) => {
  const entry = entries.find(e => e.week === currentWeek);
  return entry ? entry.rating : 'Unrated';
};
