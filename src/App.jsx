import { Provider } from "react-redux";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { store } from "./redux/store/store";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import api from "./lib/utils";
import { loginSuccess } from "./redux/reducers/authSlice";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import ProductManagement from "./pages/admin/ProductManagement";
import UserLogin from "./pages/user/UserLogin";
import UserSignup from "./pages/user/UserSignup";
import ProductListing from "./pages/user/ProductListing";
import ProductDetails from "./pages/user/ProductDetails";
import AdminUserForm from "./pages/admin/AdminUserForm";
import RedirectRoute from "./components/RedirectRoute";
import ForgotPassword from "./pages/user/ForgotPassword";

const queryClient = new QueryClient();

// Protected Route Components
const AdminProtectedRoute = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

const UserProtectedRoute = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated || user?.role !== "user") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AuthSync() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  useEffect(() => {
    // If no user in Redux/localStorage, try to fetch from backend (cookie-based session)
    if (!user && token) {
      api.get("users/profile", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.data && res.data.user) {
            dispatch(loginSuccess({ user: res.data.user, token }));
          }
        })
        .catch(() => {});
    }
  }, [user, token, dispatch]);
  return null;
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthSync />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route
                path="/login"
                element={<RedirectRoute element={<UserLogin />} />}
              />
              <Route path="/signup" element={<UserSignup />} />
              <Route path="/register" element={<UserSignup />} />
              <Route path="/products" element={<ProductListing />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route
                path="/admin/login"
                element={<RedirectRoute element={<AdminLogin />} />}
              />

              {/*admin deprotected copy*/}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/users/new" element={<AdminUserForm />} />
              <Route path="/admin/users/:id/edit" element={<AdminUserForm />} />
              <Route path="/admin/products" element={<ProductManagement />} />
              <Route
                path="/admin/categories"
                element={<CategoryManagement />}
              />
              {/* <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                }
              /> */}
              {/* <Route
                path="/admin/users"
                element={
                  <AdminProtectedRoute>
                    <UserManagement />
                  </AdminProtectedRoute>
                }
              /> */}
              {/* <Route
                path="/admin/categories"
                element={
                  <AdminProtectedRoute>
                    <CategoryManagement />
                  </AdminProtectedRoute>
                }
              /> */}
              {/* <Route
                path="/admin/products"
                element={
                  <AdminProtectedRoute>
                    <ProductManagement />
                  </AdminProtectedRoute>
                }
              /> */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
