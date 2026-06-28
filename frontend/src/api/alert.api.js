import apiClient from './axios.js';

export const sessionDismissedAlerts = new Set();
let initialLoadTime = null;

export const getAlerts = async () => {
  const { data } = await apiClient.get(`/alerts?t=${Date.now()}`);
  
  if (initialLoadTime === null) {
    initialLoadTime = Date.now();
  }
  
  // If it's been more than 3 seconds since the first load, we filter out normal lesson plan alerts
  // so they don't reappear when switching tabs, as requested. (Strict Mode safe)
  let visibleAlerts = Array.isArray(data.data) ? data.data : [];
  if (Date.now() - initialLoadTime > 3000) {
    visibleAlerts = visibleAlerts.filter(a => a.id.startsWith('alert-new-enq-'));
  }
  
  return { ...data, data: visibleAlerts };
};

export const acknowledgeAlert = async (id) => {
  sessionDismissedAlerts.add(id);
  const { data } = await apiClient.delete(`/alerts/${id}`);
  return data;
};

export default { getAlerts, acknowledgeAlert, sessionDismissedAlerts };
