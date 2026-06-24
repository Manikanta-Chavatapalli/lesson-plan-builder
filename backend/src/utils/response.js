

export const successResponse = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const createdResponse = (res, data = {}, message = 'Resource created successfully') => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res,
  message = 'An error occurred',
  statusCode = 500,
  { error = null } = {}
) => {
  const response = {
    success: false,
    message,
  };

  if (error) {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

export default {
  successResponse,
  createdResponse,
  errorResponse,
};
