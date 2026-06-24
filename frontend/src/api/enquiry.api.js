import apiClient from './axios.js';

export const getEnquiries = async () => {
  const { data } = await apiClient.get('/enquiries/teacher/enquiries');
  return data;
};

export const updateEnquiryStatus = async (id, status, responseMessage = null) => {
  const payload = { status };
  if (responseMessage) payload.responseMessage = responseMessage;
  const { data } = await apiClient.patch(`/enquiries/${id}/status`, payload);
  return data;
};

export const deleteEnquiry = async (id) => {
  const { data } = await apiClient.delete(`/enquiries/${id}`);
  return data;
};

export const getEnquiryById = async (id) => {
  const { data } = await apiClient.get(`/enquiries/${id}`);
  return data;
};

export const rejectEnquiry = async (id) => {
  const { data } = await apiClient.post(`/enquiries/${id}/reject`);
  return data;
};

export const updateEnquiryPriority = async (id, priority) => {
  const { data } = await apiClient.patch(`/enquiries/${id}/priority`, { priority });
  return data;
};

export default {
  getEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  updateEnquiryPriority,
  rejectEnquiry,
  deleteEnquiry
};
