import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom/dist/umd/react-router-dom.development";
import userAxios from "../../lib/userAxios";
import adminAxios from "../../lib/adminAxios";
import { loginSuccess, setUserAccessToken, logoutUser, setAdminAccessToken, loginSuccess as adminLoginSuccess, logoutAdmin } from '../../redux/reducers/authSlice';
import { fetchWishlist } from '../../redux/reducers/wishlistSlice';
import { fetchCart } from '../../redux/reducers/cartSlice';

const AuthSync = ({ onRestored = () => {} }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { userAccessToken, adminAccessToken } = useSelector(
    (state) => state.auth
  );
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const publicPaths = [
      "/login",
      "/signup",
      "/forgot-password",
      "/admin/login",
      "/google-auth-success",
    ];

    // Skip sync on public routes
    if (publicPaths.includes(location.pathname)) {
      onRestored();
      setLoading(false);
      return;
    }

    let pending = 0;

    const restoreUser = async () => {
      if (location.pathname.startsWith("/admin")) return;

      let token = userAccessToken;

      try {
        // If we have a token, try to fetch the profile
        if (token) {
          const profileRes = await userAxios.get("/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (profileRes?.data?.user) {
            if (profileRes.data.user.isDeleted) {
              dispatch(logoutUser());
              navigate('/login', { replace: true });
              return;
            }
            dispatch(loginSuccess({
              user: profileRes.data.user,
              userAccessToken: token,
            }));
          }
        } else {
          // No token, try to refresh
          const { data } = await userAxios.post("/auth/refresh-token");
          if (data?.token) {
            localStorage.setItem("userAccessToken", data.token);
            dispatch(setUserAccessToken(data.token));
            // Now fetch profile with new token
            const profileRes = await userAxios.get("/users/profile", {
              headers: { Authorization: `Bearer ${data.token}` },
            });
            if (profileRes?.data?.user) {
              if (profileRes.data.user.isDeleted) {
                dispatch(logoutUser());
                navigate('/login', { replace: true });
                return;
              }
              dispatch(loginSuccess({
                user: profileRes.data.user,
                userAccessToken: data.token,
              }));
            }
          } else {
            dispatch(logoutUser());
          }
        }
      } catch (err) {
        // If profile fetch fails with 401, axios interceptor will handle refresh
        // If refresh fails, user will be logged out by interceptor
        dispatch(logoutUser());
      }
    };

    const restoreAdmin = async () => {
      if (!adminAccessToken && !location.pathname.startsWith("/admin")) return;
      try {
        const { data } = await adminAxios.post("/refresh-token");
        if (data?.token) {
          localStorage.setItem("adminAccessToken", data.token);
          dispatch(setAdminAccessToken(data.token));

          const profileRes = await adminAxios.get("/profile", {
            headers: { Authorization: `Bearer ${data.token}` },
          });

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
      if (!location.pathname.startsWith("/admin") && localStorage.getItem("userAccessToken")) {
        dispatch(fetchWishlist());
      }
      // Fetch cart if user is logged in and not on admin route
      if (!location.pathname.startsWith("/admin") && localStorage.getItem("userAccessToken")) {
        dispatch(fetchCart());
      }
      setLoading(false);
      onRestored();
    };

    runSync();

    // Cleanup timer on unmount or rerun
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
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
