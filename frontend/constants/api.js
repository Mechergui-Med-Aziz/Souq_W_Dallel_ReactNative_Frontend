export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
  },
  USERS: {
    GET_BY_ID: (id) => `/api/users/id/${id}`,
    UPDATE: (id) => `/api/users/update/${id}`,
  },
};