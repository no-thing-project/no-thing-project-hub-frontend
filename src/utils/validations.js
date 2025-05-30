export const validateField = (name, value, rules) => {
  const errors = [];

  if (rules.required && !value?.toString().trim()) {
    errors.push(`${name} is required.`);
  }

  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`${name} must be at least ${rules.minLength} characters long.`);
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`${name} cannot exceed ${rules.maxLength} characters.`);
  }

  if (rules.minValue && Number(value) < rules.minValue) {
    errors.push(`${name} must be at least ${rules.minValue}.`);
  }

  if (rules.maxValue && Number(value) > rules.maxValue) {
    errors.push(`${name} cannot exceed ${rules.maxValue}.`);
  }

  if (rules.validRoles && !rules.validRoles.includes(value)) {
    errors.push(`${name} must be one of: ${rules.validRoles.join(", ")}.`);
  }

  return errors;
};

export const validateForm = (fields) => {
  const errors = {};
  Object.entries(fields).forEach(([key, { value, rules }]) => {
    const fieldErrors = validateField(key, value, rules);
    if (fieldErrors.length > 0) {
      errors[key] = fieldErrors[0];
    }
  });
  return errors;
};