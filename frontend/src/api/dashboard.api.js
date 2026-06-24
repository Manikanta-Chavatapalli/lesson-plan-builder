import apiClient from './axios.js';

export const getDashboardStats = async () => {
  const { data } = await apiClient.get('/dashboard/stats');
  return data;
};

export const getRecentPlans = async () => {
  const { data } = await apiClient.get('/dashboard/recent-plans');
  return data;
};

export const getUnifiedRecords = async () => {
  const { data } = await apiClient.get('/dashboard/unified');
  return data;
};

export const getRecentActivity = async () => {
  const { data } = await apiClient.get('/activity/recent');
  return data;
};

export default { getDashboardStats, getRecentPlans, getUnifiedRecords, getRecentActivity };
