import axios from "axios";
import { store } from "../redux/store/store";
import { logoutUser } from "../redux/reducers/authSlice";

const userAxios = axios.create({
  baseURL: import.meta.env.VITE_USER_BACKEND_URL || "http://localhost:5000",
  withCredentials: true,
});

userAxios.interceptors.request.use(
  (config) => {
    const userAccessToken = localStorage.getItem("userAccessToken");
    if (userAccessToken) {
      config.headers["Authorization"] = `Bearer ${userAccessToken}`;
      console.log(
        "userAxios request with token:",
        config.method?.toUpperCase(),
        config.url
      );
    } else {
      console.log(
        "userAxios request without token:",
        config.method?.toUpperCase(),
        config.url
      );
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
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
    console.log("userAxios response:", response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.log(
      "userAxios error:",
      error.response?.status,
      originalRequest.url,
      error.response?.data
    );

    // Prevent infinite loop and handle rate limiting
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      // Don't retry refresh token requests
      if (originalRequest.url === "/auth/refresh-token") {
        console.log("userAxios: Refresh token request failed, logging out");
        localStorage.removeItem("userAccessToken");
        localStorage.removeItem("userRole");
        store.dispatch(logoutUser());
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // Check if it's a user deleted/blocked error - log out and redirect
      if (
        error.response.data?.message &&
        (error.response.data.message.includes("deleted") ||
          error.response.data.message.includes("blocked") ||
          error.response.data.message.includes(
            "User account has been deleted"
          ) ||
          error.response.data.message.includes("Your account has been blocked"))
      ) {
        console.log("userAxios: User blocked/deleted error, logging out");
        localStorage.removeItem("userAccessToken");
        localStorage.removeItem("userRole");
        store.dispatch(logoutUser());
        window.location.href = "/login?blocked=1";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        console.log("userAxios: Refresh already in progress, queuing request");
        // Queue the request until refresh is done
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return userAxios(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      console.log("userAxios: Starting token refresh");

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_USER_BACKEND_URL || "http://localhost:5000"}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.token;
        console.log("userAxios: Token refresh successful");
        localStorage.setItem("userAccessToken", newToken);
        userAxios.defaults.headers["Authorization"] = "Bearer " + newToken;
        processQueue(null, newToken);
        return userAxios(originalRequest);
      } catch (refreshError) {
        console.log(
          "userAxios: Token refresh failed:",
          refreshError.response?.status,
          refreshError.response?.data
        );
        processQueue(refreshError, null);
        localStorage.removeItem("userAccessToken");
        localStorage.removeItem("userRole");
        store.dispatch(logoutUser());
        // Handle rate limiting specifically
        if (refreshError.response?.status === 429) {
          console.log("userAxios: Rate limited on refresh token");
          // Redirect to login with rate limit message
          window.location.href = "/login?error=rate_limit";
        } else {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle rate limiting for other requests
    if (error.response && error.response.status === 429) {
      console.log("userAxios: Rate limited:", originalRequest.url);
      // You might want to show a user-friendly message here
    }

    return Promise.reject(error);
  }
);

export default userAxios;
