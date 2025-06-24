import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  loginSuccess,
  setUserAccessToken,
} from "../../redux/reducers/authSlice";
import userAxios from "../../lib/userAxios";

const GoogleAuthSuccess = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    
    if (token) {
      console.log("Google auth token received:", token);
      
      // Store access token in localStorage
      localStorage.setItem("userAccessToken", token);
      dispatch(setUserAccessToken(token));
      
      // Fetch user profile with the token
      userAxios
        .get("/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("User profile response:", res.data);
          
          if (res.data?.user) {
            // Store user data in localStorage
            localStorage.setItem("user", JSON.stringify(res.data.user));
            
            // Dispatch login success
            dispatch(
              loginSuccess({ 
                user: res.data.user, 
                userAccessToken: token 
              })
            );
            
            console.log("Login success dispatched, navigating to home...");
            
            // Use setTimeout to ensure the state is updated before navigation
            setTimeout(() => {
              navigate("/", { replace: true });
            }, 500);
          } else {
            console.error("No user data in response");
            navigate("/login", { replace: true });
          }
        })
        .catch((error) => {
          console.error("Error fetching user profile:", error);
          navigate("/login", { replace: true });
        });
    } else {
      console.error("No token found in URL");
      navigate("/login", { replace: true });
    }
  }, [dispatch, navigate, location.search]);

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5>Signing you in with Google...</h5>
        <p className="text-muted small">Please wait while we set up your account.</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
