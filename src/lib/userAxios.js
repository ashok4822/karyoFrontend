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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

userAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Prevent infinite loop
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request until refresh is done
        return new Promise(function(resolve, reject) {
          failedQueue.push({resolve, reject});
        })
        .then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return userAxios(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const res = await axios.post('http://localhost:5000/auth/refresh-token', {}, { withCredentials: true });
        const newToken = res.data.token;
        localStorage.setItem('userAccessToken', newToken);
        userAxios.defaults.headers['Authorization'] = 'Bearer ' + newToken;
        processQueue(null, newToken);
        return userAxios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('userAccessToken');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default userAxios; 