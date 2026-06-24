export const validateLessonPlanForm = (form) => {
  const errors = {};

  if (!form.ageGroup?.trim()) errors.ageGroup = 'Age group is required';
  if (!form.theme?.trim()) errors.theme = 'Theme is required';
  if (!form.learningOutcome?.trim()) errors.learningOutcome = 'Learning outcome is required';
  if (!form.weekNumber?.toString().trim()) {
    errors.weekNumber = 'Week number is required';
  } else if (Number.isNaN(Number(form.weekNumber))) {
    errors.weekNumber = 'Week number must be numeric';
  }
  if (!form.duration?.trim()) errors.duration = 'Duration is required';

  return errors;
};

export const validateAuthForm = (form, isRegister = false) => {
  const errors = {};

  if (isRegister && !form.name?.trim()) errors.name = 'Name is required';
  if (!form.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email';
  }
  if (!form.password) {
    errors.password = 'Password is required';
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
};

export const validateGenerationForm = (form) => {
  const errors = {};
  if (!form.ageGroup?.trim()) errors.ageGroup = 'Age group is required';
  if (!form.theme?.trim()) errors.theme = 'Theme is required';
  if (!form.learningOutcome?.trim()) errors.learningOutcome = 'Learning outcome is required';
  if (!form.planFormat?.trim()) errors.planFormat = 'Plan format is required';
  if (!form.classSize?.trim()) errors.classSize = 'Class size is required';
  if (!form.duration?.trim()) errors.duration = 'Duration is required';
  if (!form.teachingStyle?.trim()) errors.teachingStyle = 'Teaching style is required';
  return errors;
};

export default {
  validateLessonPlanForm,
  validateAuthForm,
  validateGenerationForm,
};
