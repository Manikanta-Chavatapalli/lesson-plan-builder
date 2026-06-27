import apiClient from './axios.js';

export const getAlerts = async () => {
  const { data } = await apiClient.get(`/alerts?t=${Date.now()}`);
  return data;
};

export const acknowledgeAlert = async (id) => {
  const { data } = await apiClient.delete(`/alerts/${id}`);
  return data;
};

export default { getAlerts, acknowledgeAlert };
