import apiClient from './axios.js';

export const getLessonPlans = async () => {
  const { data } = await apiClient.get('/lesson-plans');
  return data;
};

export const getLessonPlanById = async (id) => {
  const { data } = await apiClient.get(`/lesson-plans/${id}`);
  return data;
};

export const createLessonPlan = async (payload) => {
  const { data } = await apiClient.post('/lesson-plans', payload);
  return data;
};

export const updateLessonPlan = async (id, payload) => {
  const { data } = await apiClient.put(`/lesson-plans/${id}`, payload);
  return data;
};

export const deleteLessonPlan = async (id) => {
  const { data } = await apiClient.delete(`/lesson-plans/${id}`);
  return data;
};

export const updateLessonPlanStatus = async (id, status) => {
  const { data } = await apiClient.patch(`/lesson-plans/${id}/status`, { status });
  return data;
};

export const updateLessonPlanPriority = async (id, priority) => {
  const { data } = await apiClient.patch(`/lesson-plans/${id}/priority`, { priority });
  return data;
};

export default {
  getLessonPlans,
  getLessonPlanById,
  createLessonPlan,
  updateLessonPlan,
  deleteLessonPlan,
  updateLessonPlanStatus,
  updateLessonPlanPriority,
};
