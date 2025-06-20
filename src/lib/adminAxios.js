import axios from 'axios';

const adminAxios = axios.create({
  baseURL: 'http://localhost:5000/admin',
  withCredentials: true,
});

adminAxios.interceptors.request.use(
  (config) => {
    const adminAccessToken = localStorage.getItem('adminAccessToken');
    if (adminAccessToken) {
      config.headers['Authorization'] = `Bearer ${adminAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('adminAccessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default adminAxios; 