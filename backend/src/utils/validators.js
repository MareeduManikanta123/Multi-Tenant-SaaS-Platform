// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate subdomain format (alphanumeric, hyphens, 3-63 chars)
function isValidSubdomain(subdomain) {
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  if (!subdomainRegex.test(subdomain)) return false;
  if (subdomain.length < 3 || subdomain.length > 63) return false;
  return true;
}

// Validate password (minimum 8 characters)
function isValidPassword(password) {
  return password && password.length >= 8;
}

// Validate UUID format
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validate required fields
// Validate required fields (supports two signatures):
// 1) validateRequired(obj, [field1, field2, ...]) -> returns array of missing field names
// 2) validateRequired(fieldName, value) -> returns boolean (true if value present)
function validateRequired(objOrField, fieldsOrValue) {
  // Signature 2: single field validation returns boolean
  if (typeof objOrField === 'string') {
    const value = fieldsOrValue;
    return value !== undefined && value !== null && value.toString().trim() !== '';
  }

  // Signature 1: object + array of fields returns missing array
  const obj = objOrField || {};
  const fields = Array.isArray(fieldsOrValue) ? fieldsOrValue : [];
  const missing = [];
  fields.forEach((field) => {
    if (!obj[field] || obj[field].toString().trim() === '') {
      missing.push(field);
    }
  });
  return missing;
}

// Validate enum
function isValidEnum(value, allowedValues) {
  return allowedValues.includes(value);
}

module.exports = {
  isValidEmail,
  isValidSubdomain,
  isValidPassword,
  isValidUUID,
  validateRequired,
  isValidEnum,
};
