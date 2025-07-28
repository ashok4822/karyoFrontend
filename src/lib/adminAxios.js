import axios from "axios";

const adminAxios = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_BACKEND_URL,
  withCredentials: true,
});

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

adminAxios.interceptors.request.use(
  (config) => {
    const adminAccessToken = localStorage.getItem("adminAccessToken");
    if (adminAccessToken) {
      config.headers["Authorization"] = `Bearer ${adminAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({resolve, reject});
        })
        .then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return adminAxios(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const res = await axios.post(`${import.meta.env.VITE_ADMIN_BACKEND_URL}/refresh-token`, {}, { withCredentials: true });
        const newToken = res.data.token;
        localStorage.setItem('adminAccessToken', newToken);
        adminAxios.defaults.headers['Authorization'] = 'Bearer ' + newToken;
        processQueue(null, newToken);
        return adminAxios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRole');
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default adminAxios;
