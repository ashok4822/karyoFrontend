import React from "react";
import { Provider } from "react-redux";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { store } from "../../redux/store/store";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import {
  loginSuccess,
  logoutUser,
  logoutAdmin,
  setUserAccessToken,
  setAdminAccessToken,
} from "../../redux/reducers/authSlice";
import Layout from "../Layout";
import userAxios from "../../lib/userAxios";
import adminAxios from "../../lib/adminAxios";

// Pages
import Index from "../../pages/Index";
import NotFound from "../../pages/NotFound";
import AdminLogin from "../../pages/admin/AdminLogin";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import UserManagement from "../../pages/admin/UserManagement";
import CategoryManagement from "../../pages/admin/CategoryManagement";
import ProductManagement from "../../pages/admin/ProductManagement";
import UserSignup from "../../pages/user/UserSignup";
import ProductListing from "../../pages/user/ProductListing";
import ProductDetails from "../../pages/user/ProductDetails";
import AdminUserForm from "../../pages/admin/AdminUserForm";
import RedirectRoute from "../../components/RedirectRoute";
import AdminRedirectRoute from "../../components/AdminRedirectRoute";
import ForgotPassword from "../../pages/user/ForgotPassword";
import GoogleAuthSuccess from "../../pages/user/GoogleAuthSuccess";
import UserLogin from "../../pages/user/UserLogin";
import AuthSync from "../../utils/sessionRestorationUtility/AuthSync";
import AdminProtectedRoute from "./protectedRoutes/AdminProtectedRoute";
import UserProtectedRoute from "./protectedRoutes/UserProtectedRoute";
import UserProfile from "../../pages/user/UserProfile";
import Wishlist from "../../pages/user/Wishlist";
import Cart from "../../pages/user/Cart";
import Checkout from "../../pages/user/Checkout";
import OrderConfirmation from "../../pages/user/OrderConfirmation";
import AdminDiscounts from "../../pages/admin/AdminDiscounts";
import AdminDiscountUsage from "../../pages/admin/AdminDiscountUsage";
import AdminOrders from "../../pages/admin/AdminOrders";
import AdminOrderDetails from "../../pages/admin/AdminOrderDetails";
import Wallet from "../../pages/user/Wallet";
import About from "../../pages/About";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const [restoring, setRestoring] = useState(true);

  return (
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

      <AuthSync onRestored={() => setRestoring(false)} />
      {!restoring && (
        <Routes>
          {/* Google Auth Success Route */}
          <Route path="/google-auth-success" element={<GoogleAuthSuccess />} />

          {/* Admin Routes - No Layout */}
          <Route 
            path="/admin/login" 
            element={
              <AdminRedirectRoute element={<AdminLogin />} />
            } 
          />
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
          <Route
            path="/admin/discounts"
            element={
              <AdminProtectedRoute>
                <AdminDiscounts />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/discounts/usage"
            element={
              <AdminProtectedRoute>
                <AdminDiscountUsage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminProtectedRoute>
                <AdminOrders />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/orders/:id"
            element={
              <AdminProtectedRoute>
                <AdminOrderDetails />
              </AdminProtectedRoute>
            }
          />
          {/* Catch-all admin route - redirect to admin dashboard */}
          <Route
            path="/admin/*"
            element={
              <AdminProtectedRoute>
                <Navigate to="/admin" replace />
              </AdminProtectedRoute>
            }
          />

          {/* User Auth Routes - No Layout */}
          <Route
            path="/login"
            element={<RedirectRoute element={<UserLogin />} />}
          />
          <Route path="/signup" element={<UserSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* User Routes - With Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route
              path="/profile"
              element={
                <UserProtectedRoute>
                  <UserProfile />
                </UserProtectedRoute>
              }
            />
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
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route 
              path="/checkout" 
              element={
                <UserProtectedRoute>
                  <Checkout />
                </UserProtectedRoute>
              } 
            />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      )}
    </BrowserRouter>
  );
};

export default AppRoutes;
