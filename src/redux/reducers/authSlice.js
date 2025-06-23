import { createSlice } from "@reduxjs/toolkit";
// import { stat } from "fs";

const initialState = {
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null,
  admin: localStorage.getItem("admin")
    ? JSON.parse(localStorage.getItem("admin"))
    : null,
  // token: localStorage.getItem("token"),
  isAuthenticated:
    !!localStorage.getItem("user") || !!localStorage.getItem("admin"),
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
      state.isAuthenticated = true;
      // state.isAuthenticated = !!action.payload.user;
      state.error = null;
      // state.user = action.payload.user;
      // state.token = action.payload.token;
      const { user, userAccessToken, adminAccessToken } = action.payload;

      if (user?.role === "admin") {
        state.admin = user;
        localStorage.setItem("admin", JSON.stringify(user));
        if (adminAccessToken) {
          state.adminAccessToken = adminAccessToken;
          localStorage.setItem("adminAccessToken", adminAccessToken);
        }
      } else {
        state.user = user;
        localStorage.setItem("user", JSON.stringify(user));
        if (userAccessToken) {
          state.userAccessToken = userAccessToken;
          localStorage.setItem("userAccessToken", userAccessToken);
        }
      }
      // if (action.payload.token) {
      //   localStorage.setItem("token", action.payload.token);
      // } else {
      //   localStorage.removeItem("token");
      // }
      // if (action.payload.userAccessToken) {
      //   state.userAccessToken = action.payload.userAccessToken;
      //   localStorage.setItem("userAccessToken", action.payload.userAccessToken);
      // }
      // if (action.payload.adminAccessToken) {
      //   state.adminAccessToken = action.payload.adminAccessToken;
      //   localStorage.setItem(
      //     "adminAccessToken",
      //     action.payload.adminAccessToken
      //   );
      // }
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logoutUser: (state) => {
      state.user = null;
      state.userAccessToken = null;
      state.isAuthenticated = !!state.admin; // still true if admin is logged in
      localStorage.removeItem("user");
      localStorage.removeItem("userAccessToken");
    },
    logoutAdmin: (state) => {
      state.admin = null;
      state.adminAccessToken = null;
      state.isAuthenticated = !!state.user; // still true if user is logged in
      localStorage.removeItem("admin");
      localStorage.removeItem("adminAccessToken");
    },
    // logout: (state) => {
    //   // full logout for both
    //   state.user = null;
    //   state.admin = null;
    //   state.userAccessToken = null;
    //   state.adminAccessToken = null;
    //   // state.token = null;
    //   state.isAuthenticated = false;
    //   state.loading = false;
    //   state.error = null;
    //   // localStorage.removeItem("token");
    //   localStorage.removeItem("user");
    //   localStorage.removeItem("admin");
    //   localStorage.removeItem("userAccessToken");
    //   localStorage.removeItem("adminAccessToken");
    // },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      } else if (state.admin) {
        state.admin = { ...state.admin, ...action.payload };
      }
    },
    loadUser: (state) => {
      const user = localStorage.getItem("user");
      const admin = localStorage.getItem("admin");

      state.user = user ? JSON.parse(user) : null;
      state.admin = admin ? JSON.parse(admin) : null;

      state.isAuthenticated = !!user || !!admin;
      state.userAccessToken = localStorage.getItem("userAccessToken");
      state.adminAccessToken = localStorage.getItem("adminAccessToken");
      // if (user) {
      //   state.user = JSON.parse(user);
      //   state.isAuthenticated = true;
      // } else {
      //   state.user = null;
      //   state.isAuthenticated = false;
      // }
      // state.token = localStorage.getItem("token");
    },
    setUserAccessToken: (state, action) => {
      state.userAccessToken = action.payload;
      localStorage.setItem("userAccessToken", action.payload);
    },
    setAdminAccessToken: (state, action) => {
      state.adminAccessToken = action.payload;
      localStorage.setItem("adminAccessToken", action.payload);
    },
    // logoutUser: (state) => {
    //   state.userAccessToken = null;
    //   localStorage.removeItem("userAccessToken");
    // },
    // logoutAdmin: (state) => {
    //   state.adminAccessToken = null;
    //   localStorage.removeItem("adminAccessToken");
    // },
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
