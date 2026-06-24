export const RECORD_STATUS = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FOLLOW_UP: 'Follow-up',
};

export const RECORD_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const LESSON_STATUS = RECORD_STATUS;
export const ENQUIRY_STATUS = RECORD_STATUS;

export const ALERT_STATUS = {
  UNREAD: 'Unread',
  READ: 'Read',
};

export const RECOMMENDATION_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EDITED: 'Edited',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
};

export default {
  LESSON_STATUS,
  ENQUIRY_STATUS,
  RECORD_STATUS,
  RECORD_PRIORITY,
  ALERT_STATUS,
  RECOMMENDATION_STATUS,
  HTTP_STATUS,
};
