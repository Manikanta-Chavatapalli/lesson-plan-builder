export const getApiError = (error) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    'An unexpected error occurred';

  const details = error?.response?.data?.error || null;

  return { message, status: error?.response?.status || 500, details };
};

export default getApiError;
