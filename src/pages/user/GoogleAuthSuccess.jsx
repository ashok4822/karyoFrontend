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
      // Store access token in localStorage
      localStorage.setItem("userAccessToken", token);
      // Fetch user profile with the token
      userAxios
        .get("/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data?.user) {
            dispatch(
              loginSuccess({ user: res.data.user, userAccessToken: token })
            );
            navigate("/");
          } else {
            navigate("/login");
          }
        })
        .catch(() => {
          navigate("/login");
        });
    } else {
      navigate("/login");
    }
  }, [dispatch, navigate, location.search]);

  return <div>Signing you in with Google...</div>;
};

export default GoogleAuthSuccess;
