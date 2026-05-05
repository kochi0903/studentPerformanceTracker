/**
 * Convert a Firestore document's Timestamp fields to plain serializable objects.
 * Recursively walks own properties, turning any value with a `.toMillis()` method
 * (i.e. a Firestore Timestamp) into an ISO string.
 *
 * @param {Object} docData - A plain object spread from a Firestore DocumentSnapshot.
 * @returns {Object} - The same shape with Timestamps replaced by ISO strings.
 */
export const serializeDoc = (docData) => {
  if (!docData || typeof docData !== 'object') return docData;

  const result = {};
  for (const [key, value] of Object.entries(docData)) {
    if (value && typeof value.toDate === 'function') {
      // Firestore Timestamp → ISO string
      result[key] = value.toDate().toISOString();
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        item && typeof item === 'object' ? serializeDoc(item) : item
      );
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      result[key] = serializeDoc(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};
