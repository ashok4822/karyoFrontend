import axios from 'axios';

const userAxios = axios.create({
  baseURL: 'http://localhost:5000/',
  withCredentials: true,
});

userAxios.interceptors.request.use(
  (config) => {
    const userAccessToken = localStorage.getItem('userAccessToken');
    if (userAccessToken) {
      config.headers['Authorization'] = `Bearer ${userAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

userAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('userAccessToken');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default userAxios; 