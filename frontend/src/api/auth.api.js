import apiClient from './axios.js';

export const checkUser = async (payload) => {
  const { data } = await apiClient.post('/users/check-user', payload);
  return data;
};

export const requestOtp = async (payload) => {
  const { data } = await apiClient.post('/auth/request-otp', payload);
  return data;
};

export const verifyOtp = async (payload) => {
  const { data } = await apiClient.post('/auth/verify-otp', payload);
  return data;
};

export const logout = async () => {
  const { data } = await apiClient.post('/auth/logout');
  return data;
};

export const getMe = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data;
};

export default { checkUser, requestOtp, verifyOtp, logout, getMe };