import schema from './firebase.common.schema.json';

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isIsoDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isTimestampLike = (value) =>
  value instanceof Date ||
  typeof value === 'string' ||
  typeof value === 'number' ||
  (typeof value === 'object' && value !== null);

const typeCheckers = {
  string: (value) => typeof value === 'string',
  number: isFiniteNumber,
  integer: (value) => Number.isInteger(value),
  boolean: (value) => typeof value === 'boolean',
  object: isPlainObject,
  timestamp: isTimestampLike,
  date: isIsoDate,
  latlng: (value) =>
    isPlainObject(value) &&
    isFiniteNumber(value.lat) &&
    isFiniteNumber(value.lng) &&
    value.lat >= -90 &&
    value.lat <= 90 &&
    value.lng >= -180 &&
    value.lng <= 180,
  'string[]': (value) => Array.isArray(value) && value.every((entry) => typeof entry === 'string')
};

const getSchemaEntry = (schemaKey) => {
  const entry = schema?.collections?.[schemaKey];
  if (!entry) {
    throw new Error(`[firebase-schema] Unknown schema key: "${schemaKey}"`);
  }
  return entry;
};

export const getCollectionName = (schemaKey) => {
  const entry = getSchemaEntry(schemaKey);
  return String(entry.path).split('/')[0];
};

export const COLLECTIONS = Object.freeze({
  users: getCollectionName('users'),
  patients: getCollectionName('patients'),
  surveys: getCollectionName('surveys'),
  alerts: getCollectionName('alerts'),
  vitals: getCollectionName('vitals')
});

export const validateFirestoreDocument = (schemaKey, data, { partial = false } = {}) => {
  if (!isPlainObject(data)) {
    throw new Error(`[firebase-schema] "${schemaKey}" data must be an object`);
  }

  const entry = getSchemaEntry(schemaKey);
  const required = entry.required || [];

  if (!partial) {
    const missing = required.filter((field) => data[field] === undefined || data[field] === null);
    if (missing.length > 0) {
      throw new Error(`[firebase-schema] "${schemaKey}" missing required fields: ${missing.join(', ')}`);
    }
  }

  const fields = entry.fields || {};
  const enums = entry.enums || {};

  for (const [field, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue;
    }

    const expectedType = fields[field];
    if (!expectedType) {
      if (entry.allowAdditionalFields === false) {
        throw new Error(`[firebase-schema] "${schemaKey}" unexpected field: ${field}`);
      }
      continue;
    }

    const checker = typeCheckers[expectedType];
    if (checker && !checker(value)) {
      throw new Error(`[firebase-schema] "${schemaKey}.${field}" must be ${expectedType}`);
    }

    const allowedValues = enums[field];
    if (Array.isArray(allowedValues) && !allowedValues.includes(value)) {
      throw new Error(
        `[firebase-schema] "${schemaKey}.${field}" must be one of: ${allowedValues.join(', ')}`
      );
    }
  }

  return true;
};

export const FIREBASE_COMMON_SCHEMA = schema;
