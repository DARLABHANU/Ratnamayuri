const crypto = require('crypto');

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')    // Remove non-word characters
    .replace(/[\s_-]+/g, '-')     // Replace spaces/underscores with a single hyphen
    .replace(/^-+|-+$/g, '');     // Trim leading/trailing hyphens
};

const generateOrderNumber = () => {
  const digits = '0123456789';
  let randomDigits = '';
  for (let i = 0; i < 10; i++) {
    randomDigits += digits[crypto.randomInt(0, 10)];
  }
  return `RM${randomDigits}`;
};

const generateAccountNumber = () => {
  const digits = '0123456789';
  let randomDigits = '';
  for (let i = 0; i < 10; i++) {
    randomDigits += digits[crypto.randomInt(0, 10)];
  }
  return `RM${randomDigits}`;
};

module.exports = {
  slugify,
  generateOrderNumber,
  generateAccountNumber
};
