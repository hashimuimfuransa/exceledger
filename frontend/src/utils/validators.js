export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return re.test(password);
};

export const validateRequired = (value) => {
  return value !== undefined && value !== null && value.toString().trim() !== '';
};

export const validateNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

export const validatePositiveNumber = (value) => {
  return validateNumber(value) && parseFloat(value) > 0;
};

export const validateAccountCode = (code) => {
  // Account code should be 4 digits
  const re = /^\d{4}$/;
  return re.test(code);
};

export const validatePhoneNumber = (phone) => {
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

export const validateFutureDate = (date) => {
  return validateDate(date) && date > new Date();
};

export const validatePastDate = (date) => {
  return validateDate(date) && date < new Date();
};

export const getValidationErrors = (formData, validationRules) => {
  const errors = {};

  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = formData[field];

    if (rules.required && !validateRequired(value)) {
      errors[field] = rules.requiredMessage || `${field} is required`;
      return;
    }

    if (value && rules.type) {
      switch (rules.type) {
        case 'email':
          if (!validateEmail(value)) {
            errors[field] = rules.emailMessage || 'Please enter a valid email address';
          }
          break;
        case 'password':
          if (!validatePassword(value)) {
            errors[field] = rules.passwordMessage || 'Password must be at least 8 characters with uppercase, lowercase, and number';
          }
          break;
        case 'number':
          if (!validateNumber(value)) {
            errors[field] = rules.numberMessage || 'Please enter a valid number';
          }
          break;
        case 'positiveNumber':
          if (!validatePositiveNumber(value)) {
            errors[field] = rules.positiveNumberMessage || 'Please enter a positive number';
          }
          break;
        case 'accountCode':
          if (!validateAccountCode(value)) {
            errors[field] = rules.accountCodeMessage || 'Account code must be 4 digits';
          }
          break;
        case 'phone':
          if (!validatePhoneNumber(value)) {
            errors[field] = rules.phoneMessage || 'Please enter a valid phone number';
          }
          break;
        case 'url':
          if (!validateURL(value)) {
            errors[field] = rules.urlMessage || 'Please enter a valid URL';
          }
          break;
        default:
          break;
      }
    }

    if (value && rules.minLength && value.length < rules.minLength) {
      errors[field] = rules.minLengthMessage || `${field} must be at least ${rules.minLength} characters`;
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      errors[field] = rules.maxLengthMessage || `${field} must not exceed ${rules.maxLength} characters`;
    }

    if (value && rules.min && parseFloat(value) < rules.min) {
      errors[field] = rules.minMessage || `${field} must be at least ${rules.min}`;
    }

    if (value && rules.max && parseFloat(value) > rules.max) {
      errors[field] = rules.maxMessage || `${field} must not exceed ${rules.max}`;
    }

    if (value && rules.pattern && !rules.pattern.test(value)) {
      errors[field] = rules.patternMessage || `${field} format is invalid`;
    }
  });

  return errors;
};

export const hasValidationErrors = (errors) => {
  return Object.keys(errors).length > 0;
};
