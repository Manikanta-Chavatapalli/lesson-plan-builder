import apiClient from './axios.js';

export const generateRecommendations = async (payload) => {
  const { data } = await apiClient.post('/recommendations/generate', payload);
  return data;
};

export const getRecommendationsByLessonId = async (lessonId) => {
  const { data } = await apiClient.get(`/recommendations/${lessonId}`);
  return data;
};

export const applyRecommendation = async (payload) => {
  const { data } = await apiClient.put('/recommendations/apply', payload);
  return data;
};

export default {
  generateRecommendations,
  getRecommendationsByLessonId,
  applyRecommendation,
};
