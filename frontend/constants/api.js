export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/users/add',
  },
  USERS: {
    GET_BY_ID: (id) => `/users/id/${id}`,
    UPDATE: (id) => `/users/update/${id}`,
  },
  BOOKS: {
    GET_ALL: '/books',
    GET_BY_ID: (id) => `/books/${id}`,
    CREATE: '/books',
    UPDATE: (id) => `/books/${id}`,
    DELETE: (id) => `/books/${id}`,
  },
};