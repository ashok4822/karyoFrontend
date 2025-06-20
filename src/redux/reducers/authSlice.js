import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("user"),
  loading: false,
  error: null,
  userAccessToken: localStorage.getItem("userAccessToken") || null,
  adminAccessToken: localStorage.getItem("adminAccessToken") || null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = !!action.payload.user;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      if (action.payload.token) {
        localStorage.setItem("token", action.payload.token);
      } else {
        localStorage.removeItem("token");
      }
      if (action.payload.userAccessToken) {
        state.userAccessToken = action.payload.userAccessToken;
        localStorage.setItem("userAccessToken", action.payload.userAccessToken);
      }
      if (action.payload.adminAccessToken) {
        state.adminAccessToken = action.payload.adminAccessToken;
        localStorage.setItem("adminAccessToken", action.payload.adminAccessToken);
      }
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.userAccessToken = null;
      state.adminAccessToken = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userAccessToken");
      localStorage.removeItem("adminAccessToken");
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    loadUser: (state) => {
      const user = localStorage.getItem("user");
      if (user) {
        state.user = JSON.parse(user);
        state.isAuthenticated = true;
      } else {
        state.user = null;
        state.isAuthenticated = false;
      }
      state.token = localStorage.getItem("token");
    },
    setUserAccessToken: (state, action) => {
      state.userAccessToken = action.payload;
      localStorage.setItem("userAccessToken", action.payload);
    },
    setAdminAccessToken: (state, action) => {
      state.adminAccessToken = action.payload;
      localStorage.setItem("adminAccessToken", action.payload);
    },
    logoutUser: (state) => {
      state.userAccessToken = null;
      localStorage.removeItem("userAccessToken");
    },
    logoutAdmin: (state) => {
      state.adminAccessToken = null;
      localStorage.removeItem("adminAccessToken");
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  loadUser,
  setUserAccessToken,
  setAdminAccessToken,
  logoutUser,
  logoutAdmin,
} = authSlice.actions;
export default authSlice.reducer;
