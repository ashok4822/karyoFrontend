import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  loginSuccess,
  setUserAccessToken,
} from "../../redux/reducers/authSlice";
import { fetchUserProfile } from "../../services/user/authService";
import { fetchCart } from "../../redux/reducers/cartSlice";
import { fetchWishlist } from "../../redux/reducers/wishlistSlice";

const GoogleAuthSuccess = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (!token) {
      console.error("No token found in URL");
      return navigate("/login", { replace: true });
    }

    console.log("Google auth token received:", token);

    // Store access token locally
    localStorage.setItem("userAccessToken", token);
    dispatch(setUserAccessToken(token));

    // Fetch user profile using service
    fetchUserProfile(token).then((result) => {
      if (result.success && result.data?.user) {
        const user = result.data.user;

        // Save to localStorage
        localStorage.setItem("user", JSON.stringify(user));

        // Dispatch login
        dispatch(loginSuccess({ user, userAccessToken: token }));

        // Fetch cart and wishlist after Google login
        dispatch(fetchCart());
        dispatch(fetchWishlist());

        console.log("Login success dispatched, navigating to home...");

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 500);
      } else {
        console.error("Profile fetch failed:", result.error);
        navigate("/login", { replace: true });
      }
    });
  }, [dispatch, navigate, location.search]);

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5>Signing you in with Google...</h5>
        <p className="text-muted small">
          Please wait while we set up your account.
        </p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
