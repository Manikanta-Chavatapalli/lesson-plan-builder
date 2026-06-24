import apiClient from './axios.js';

export const generateLesson = async (payload) => {
  const { data } = await apiClient.post('/lesson-plans/generate', payload);
  return data;
};

export default { generateLesson };
