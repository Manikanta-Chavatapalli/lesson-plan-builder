import apiClient from './axios.js';

export const getHistory = async () => {
  const { data } = await apiClient.get('/activity');
  return data;
};

export const deleteHistory = async (id) => {
  const { data } = await apiClient.delete(`/activity/${id}`);
  return data;
};

export default { getHistory, deleteHistory };
