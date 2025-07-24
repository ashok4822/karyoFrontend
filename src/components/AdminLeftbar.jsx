import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FaSignOutAlt,
  FaTachometerAlt,
  FaBoxOpen,
  FaUsers,
  FaShoppingCart,
  FaTags,
  FaList,
  FaGift,
  FaImage,
  FaChartBar,
  FaPercent,
} from "react-icons/fa";
import "./AdminLeftbar.css";
import { useDispatch } from "react-redux";
import { logoutAdmin } from "../redux/reducers/authSlice";
import { logoutAdminApi } from "../services/admin/adminAuthService";

const admin = {
  name: "Admin Name",
  image: "/public/profilePic.jpg", // Replace with actual admin image path
};

const links = [
  { to: "/admin", icon: <FaTachometerAlt />, label: "Dashboard" },
  { to: "/admin/products", icon: <FaBoxOpen />, label: "Products" },
  { to: "/admin/users", icon: <FaUsers />, label: "Customers" },
  { to: "/admin/orders", icon: <FaShoppingCart />, label: "Orders" },
  { to: "/admin/coupons", icon: <FaTags />, label: "Coupons" },
  { to: "/admin/categories", icon: <FaList />, label: "Category" },
  { to: "/admin/offers", icon: <FaGift />, label: "Offers" },
  // { to: "/admin/banners", icon: <FaImage />, label: "Banner" },
  { to: "/admin/discounts", icon: <FaPercent />, label: "Discounts" },
  { to: "/admin/discounts/usage", icon: <FaChartBar />, label: "Discount Analytics" },
  { to: "/admin/sales-report", icon: <FaChartBar />, label: "Sales Report" },
];

const AdminLeftbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await logoutAdminApi();
    } catch (e) {}
    dispatch(logoutAdmin());
    localStorage.removeItem("adminAccessToken");
    navigate("/admin/login");
  };

  const isActiveLink = (to) => {
    if (to === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/";
    }
    return location.pathname.startsWith(to);
  };

  return (
    <div
      className="admin-leftbar bg-white border-end shadow-sm d-flex flex-column p-3"
      style={{ minHeight: "100vh", width: "250px" }}
    >
      <div className="admin-profile d-flex flex-column align-items-center mb-4">
        <img
          src={admin.image}
          alt="Admin"
          className="rounded-circle mb-2 admin-avatar"
          width={70}
          height={70}
        />
        <h5 className="mb-1">{admin.name}</h5>
        <button
          className="btn btn-outline-danger btn-sm mt-2 d-flex align-items-center gap-2"
          onClick={handleLogout}
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>
      <nav className="nav flex-column admin-nav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={
              "nav-link d-flex align-items-center gap-2" +
              (isActiveLink(link.to) ? " active" : "")
            }
            end={link.to === "/admin"}
          >
            {link.icon} {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AdminLeftbar;
