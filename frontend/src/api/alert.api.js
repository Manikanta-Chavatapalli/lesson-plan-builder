import apiClient from './axios.js';

export const sessionDismissedAlerts = new Set();
export let hasOpenedAlertsPage = false;
let unmountTimer = null;

export const setOpenedAlertsPage = (val) => {
  unmountTimer = setTimeout(() => {
    hasOpenedAlertsPage = val;
  }, 200);
};

export const cancelOpenedAlertsPage = () => {
  if (unmountTimer) {
    clearTimeout(unmountTimer);
  }
};

export const getAlerts = async () => {
  const { data } = await apiClient.get(`/alerts?t=${Date.now()}`);
  let visibleAlerts = Array.isArray(data.data) ? data.data : [];
  return { ...data, data: visibleAlerts };
};

export const acknowledgeAlert = async (id) => {
  sessionDismissedAlerts.add(id);
  const { data } = await apiClient.delete(`/alerts/${id}`);
  return data;
};

export default { getAlerts, acknowledgeAlert, sessionDismissedAlerts, hasOpenedAlertsPage, setOpenedAlertsPage, cancelOpenedAlertsPage };
