import { Provider } from "react-redux";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { store } from "./redux/store/store";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
// import api from "./lib/utils";
import {
  loginSuccess,
  logoutUser,
  logoutAdmin,
  setUserAccessToken,
  setAdminAccessToken,
} from "./redux/reducers/authSlice";
import Layout from "./components/Layout";
import userAxios from "./lib/userAxios";
import adminAxios from "./lib/adminAxios";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import ProductManagement from "./pages/admin/ProductManagement";
// import UserLogin from "./pages/user/UserLogin";
import UserSignup from "./pages/user/UserSignup";
import ProductListing from "./pages/user/ProductListing";
import ProductDetails from "./pages/user/ProductDetails";
import AdminUserForm from "./pages/admin/AdminUserForm";
import RedirectRoute from "./components/RedirectRoute";
import ForgotPassword from "./pages/user/ForgotPassword";
import GoogleAuthSuccess from "./pages/user/GoogleAuthSuccess";
import UserLogin from "./pages/user/UserLogin";

const queryClient = new QueryClient();

// Protected Route Components
const AdminProtectedRoute = ({ children }) => {
  const { admin, adminAccessToken } = useSelector((state) => state.auth);
  if (!admin || admin?.role !== "admin" || !adminAccessToken) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

const UserProtectedRoute = ({ children }) => {
  const { user, userAccessToken } = useSelector((state) => state.auth);

  if (!user || user?.role !== "user" || !userAccessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// function AuthSync({ onRestored }) {
//   const dispatch = useDispatch();
//   const location = useLocation();
//   const { userAccessToken, adminAccessToken } = useSelector(
//     (state) => state.auth
//   );

//   useEffect(() => {
//     // Only run restore logic if NOT on public routes
//     const publicPaths = [
//       "/login",
//       "/signup",
//       "/forgot-password",
//       "/admin/login",
//     ];
//     if (publicPaths.includes(location.pathname)) {
//       onRestored();
//       return;
//     }

//     let pending = 2;
//     let done = () => {
//       pending -= 1;
//       if (pending === 0) onRestored();
//     };

//     if (!userAccessToken) {
//       userAxios
//         .post("/auth/refresh-token")
//         .then((res) => {
//           if (res.data.token) {
//             localStorage.setItem("userAccessToken", res.data.token);
//             dispatch(setUserAccessToken(res.data.token));
//             userAxios
//               .get("/users/profile", {
//                 headers: { Authorization: `Bearer ${res.data.token}` },
//               })
//               .then((profileRes) => {
//                 if (profileRes.data && profileRes.data.user) {
//                   dispatch(
//                     loginSuccess({
//                       user: profileRes.data.user,
//                       token: res.data.token,
//                       userAccessToken: res.data.token,
//                     })
//                   );
//                 }
//                 done();
//               })
//               .catch(() => {
//                 dispatch({ type: "auth/logout" });
//                 done();
//               });
//             return;
//           }
//           done();
//         })
//         .catch(() => {
//           dispatch({ type: "auth/logout" });
//           done();
//         });
//     } else {
//       done();
//     }

//     if (!adminAccessToken) {
//       adminAxios
//         .post("/refresh-token")
//         .then((res) => {
//           if (res.data.token) {
//             localStorage.setItem("adminAccessToken", res.data.token);
//             dispatch(setAdminAccessToken(res.data.token));
//           }
//           done();
//         })
//         .catch(() => {
//           dispatch({ type: "auth/logout" });
//           done();
//         });
//     } else {
//       done();
//     }
//   }, [
//     dispatch,
//     userAccessToken,
//     adminAccessToken,
//     onRestored,
//     location.pathname,
//   ]);
//   return null;
// }

const AuthSync = ({ onRestored = () => {} }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { userAccessToken, adminAccessToken } = useSelector(
    (state) => state.auth
  );
  const [loading, setLoading] = useState(true);

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
      if (!userAccessToken && location.pathname.startsWith("/admin")) return;
      try {
        const { data } = await userAxios.post("/auth/refresh-token");
        if (data?.token) {
          localStorage.setItem("userAccessToken", data.token);
          dispatch(setUserAccessToken(data.token));

          const profileRes = await userAxios.get("/users/profile", {
            headers: { Authorization: `Bearer ${data.token}` },
          });

          if (profileRes?.data?.user) {
            dispatch(
              loginSuccess({
                user: profileRes.data.user,
                userAccessToken: data.token,
              })
            );
          }
        }
      } catch {
        // Only logout user if you're in a user route
        if (!location.pathname.startsWith("/admin")) {
          dispatch(logoutUser());
        }
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
      setLoading(true);
      const tasks = [];

      if (!userAccessToken) tasks.push(restoreUser());
      if (!adminAccessToken) tasks.push(restoreAdmin());

      await Promise.allSettled(tasks);
      setLoading(false);
      onRestored();
    };

    runSync();
  }, [
    dispatch,
    userAccessToken,
    adminAccessToken,
    location.pathname,
    onRestored,
  ]);

  if (loading)
    return <div className="text-center py-4">Restoring session...</div>;
  return null;
};

function App() {
  const [restoring, setRestoring] = useState(true);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            {restoring && (
              <div
                style={{
                  minHeight: "100vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span>Restoring session...</span>
              </div>
            )}

            {/* Render this first to allow GoogleAuthSuccess to save token */}
            <Routes>
              <Route
                path="/google-auth-success"
                element={<GoogleAuthSuccess />}
              />
            </Routes>

            {/* AuthSync can now wait until the token is handled */}
            {restoring && (
              <div
                style={{
                  minHeight: "100vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span>Restoring session...</span>
              </div>
            )}

            <AuthSync onRestored={() => setRestoring(false)} />
            {!restoring && (
              <Routes>
                {/* Admin Routes - No Layout */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminProtectedRoute>
                      <UserManagement />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users/new"
                  element={
                    <AdminProtectedRoute>
                      <AdminUserForm />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users/:id/edit"
                  element={
                    <AdminProtectedRoute>
                      <AdminUserForm />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <AdminProtectedRoute>
                      <ProductManagement />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <AdminProtectedRoute>
                      <CategoryManagement />
                    </AdminProtectedRoute>
                  }
                />

                {/* User Routes - With Layout */}
                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route
                    path="/login"
                    element={<RedirectRoute element={<UserLogin />} />}
                  />
                  <Route path="/signup" element={<UserSignup />} />
                  <Route
                    path="/products"
                    element={
                      <UserProtectedRoute>
                        <ProductListing />
                      </UserProtectedRoute>
                    }
                  />
                  <Route
                    path="/products/:id"
                    element={
                      <UserProtectedRoute>
                        <ProductDetails />
                      </UserProtectedRoute>
                    }
                  />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            )}
          </BrowserRouter>
          {/* <Toaster /> */}
          {/* <Sonner /> */}
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
