import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useLocation,
  useNavigate,
} from "react-router-dom/dist/umd/react-router-dom.development";
import {
  loginSuccess,
  setUserAccessToken,
  logoutUser,
  setAdminAccessToken,
  loginSuccess as adminLoginSuccess,
  logoutAdmin,
} from "../redux/reducers/authSlice";
import { fetchWishlist } from "../redux/reducers/wishlistSlice";
import { fetchCart } from "../redux/reducers/cartSlice";
import {
  fetchUserProfile,
  refreshUserToken,
} from "../services/user/authService";
import {
  refreshAdminToken,
  fetchAdminProfile,
} from "../services/admin/adminAuthService";

const AuthSync = ({ onRestored = () => {} }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { userAccessToken, adminAccessToken } = useSelector(
    (state) => state.auth
  );
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const syncInProgressRef = useRef(false);

  useEffect(() => {
    const publicPaths = [
      "/login",
      "/signup",
      "/forgot-password",
      "/admin/login",
      "/google-auth-success",
    ];

    // Skip sync on public routes and profile page (let profile page handle its own auth)
    if (
      publicPaths.includes(location.pathname) ||
      location.pathname === "/profile"
    ) {
      onRestored();
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous syncs
    if (syncInProgressRef.current) {
      console.log("AuthSync: Sync already in progress, skipping");
      return;
    }

    const restoreUser = async () => {
      if (location.pathname.startsWith("/admin")) return;

      let token = userAccessToken;
      console.log(
        "AuthSync: Starting user restoration, token exists:",
        !!token
      );

      try {
        // If we have a token, try to fetch the profile
        if (token) {
          console.log(
            "AuthSync: Attempting to fetch profile with existing token"
          );
          const profileRes = await fetchUserProfile(token);
          if (profileRes?.data?.user) {
            console.log("AuthSync: Profile fetch successful");
            if (profileRes.data.user.isDeleted) {
              console.log("AuthSync: User is deleted, logging out");
              dispatch(logoutUser());
              navigate("/login", { replace: true });
              return;
            }
            dispatch(
              loginSuccess({
                user: profileRes.data.user,
                userAccessToken: token,
              })
            );
            return; // Success, no need to refresh
          }
        }

        // No token or profile fetch failed, try to refresh
        console.log(
          "AuthSync: No token or profile fetch failed, attempting refresh"
        );
        try {
          const { data } = await refreshUserToken();
          if (data?.token) {
            console.log(
              "AuthSync: Refresh successful, fetching profile with new token"
            );
            localStorage.setItem("userAccessToken", data.token);
            dispatch(setUserAccessToken(data.token));
            // Now fetch profile with new token
            const profileRes = await fetchUserProfile(data.token);
            if (profileRes?.data?.user) {
              if (profileRes.data.user.isDeleted) {
                console.log(
                  "AuthSync: User is deleted after refresh, logging out"
                );
                dispatch(logoutUser());
                navigate("/login", { replace: true });
                return;
              }
              dispatch(
                loginSuccess({
                  user: profileRes.data.user,
                  userAccessToken: data.token,
                })
              );
            }
          } else {
            console.log("AuthSync: Refresh failed - no token in response");
            dispatch(logoutUser());
          }
        } catch (refreshError) {
          // If refresh fails (including rate limiting), logout user
          console.log(
            "AuthSync: Refresh token failed:",
            refreshError.response?.status,
            refreshError.response?.data
          );
          dispatch(logoutUser());
          if (refreshError.response?.status === 429) {
            // Rate limited - redirect to login with message
            console.log("AuthSync: Rate limited, redirecting to login");
            navigate("/login", {
              replace: true,
              state: {
                message:
                  "Too many authentication attempts. Please try again later.",
              },
            });
          }
        }
      } catch (err) {
        // If profile fetch fails with 401, we already tried refresh above
        console.log(
          "AuthSync: Profile fetch failed:",
          err.response?.status,
          err.response?.data
        );
        dispatch(logoutUser());
      }
    };

    const restoreAdmin = async () => {
      if (!adminAccessToken && !location.pathname.startsWith("/admin")) return;
      try {
        const { data } = await refreshAdminToken();
        if (data?.token) {
          localStorage.setItem("adminAccessToken", data.token);
          dispatch(setAdminAccessToken(data.token));

          const profileRes = await fetchAdminProfile(data.token);

          if (profileRes?.data?.user) {
            if (profileRes.data.user.isDeleted) {
              dispatch(logoutAdmin());
              return;
            }
            dispatch(
              loginSuccess({
                user: profileRes.data.user,
                adminAccessToken: data.token,
              })
            );
          }
        }
      } catch {
        if (location.pathname.startsWith("/admin")) {
          dispatch(logoutAdmin());
        }
      }
    };

    const runSync = async () => {
      // Prevent multiple simultaneous syncs
      if (syncInProgressRef.current) {
        return;
      }

      syncInProgressRef.current = true;
      console.log("AuthSync: Starting sync process");

      // Start a timer to show loading after 500ms
      timerRef.current = setTimeout(() => setLoading(true), 500);
      const tasks = [];

      // Always restore user session if not on admin route
      if (!location.pathname.startsWith("/admin")) tasks.push(restoreUser());
      if (!adminAccessToken) tasks.push(restoreAdmin());

      await Promise.allSettled(tasks);

      // Restoration finished, clear timer and hide loading
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Fetch wishlist if user is logged in and not on admin route
      if (
        !location.pathname.startsWith("/admin") &&
        localStorage.getItem("userAccessToken")
      ) {
        dispatch(fetchWishlist());
      }
      // Fetch cart if user is logged in and not on admin route
      if (
        !location.pathname.startsWith("/admin") &&
        localStorage.getItem("userAccessToken")
      ) {
        dispatch(fetchCart());
      }

      setLoading(false);
      syncInProgressRef.current = false;
      console.log("AuthSync: Sync process completed");
      onRestored();
    };

    runSync();

    // Cleanup timer on unmount or rerun
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      syncInProgressRef.current = false;
    };
  }, [
    dispatch,
    userAccessToken,
    adminAccessToken,
    location.pathname,
    onRestored,
    navigate,
  ]);

  if (loading)
    return <div className="text-center py-4">Restoring session...</div>;
  return null;
};

export default AuthSync;
