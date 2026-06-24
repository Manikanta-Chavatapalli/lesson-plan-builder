import apiClient from './axios.js';

/**
 * Health check API call.
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export const checkHealth = async () => {
  const { data } = await apiClient.get('/health');
  return data;
};

export default {
  checkHealth,
};
