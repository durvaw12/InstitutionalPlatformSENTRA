import { useState } from "react";
import {
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import {
  useNavigate,
  Link,
} from "react-router-dom";

import "../styles/designSystem.css";
import "../styles/loginPage.css";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();


  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = (e) => {
    e.preventDefault();

    setErrors({});

    if (!validateForm()) {
      return;
    }

    

    const users =
      JSON.parse(localStorage.getItem("sentraUsers")) || [];



    const user = users.find(
      (registeredUser) =>
        registeredUser.email.toLowerCase() ===
          formData.email.toLowerCase() &&
        registeredUser.password === formData.password
    );

    

    if (!user) {
      setErrors({
        login:
          "Invalid email or password. Please check your credentials.",
      });

      return;
    }



    localStorage.setItem(
      "sentraCurrentUser",
      JSON.stringify(user)
    );

 

    if (rememberMe) {
      localStorage.setItem(
        "sentraRememberMe",
        "true"
      );
    } else {
      localStorage.removeItem(
        "sentraRememberMe"
      );
    }


    if (user.role === "administrator") {
      navigate("/admin/dashboard");
      return;
    }

    if (user.role === "student") {
      navigate("/dashboard");
      return;
    }

    if (user.role === "staff") {
      navigate("/staff/dashboard");
      return;
    }


    setErrors({
      login:
        "Invalid user role. Please contact the administrator.",
    });
  };



  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Remove error when user starts typing
    if (errors[name] || errors.login) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
        login: "",
      }));
    }
  };

  return (
    <div className="login-container">

      <div className="login-split-screen">

        {/* =================================================
            LEFT SIDE - BRANDING
            ================================================= */}

        <div className="login-branding">

          <div className="branding-content">

            {/* LOGO */}

            <div className="logo-section">

              <div className="logo-icon">
                <Shield size={48} />
              </div>

              <h1 className="logo-text">
                Sentra
              </h1>

            </div>

            {/* MESSAGE */}

            <div className="branding-message">

              <h2>
                A safer campus starts with speaking up.
              </h2>

              <p>
                Secure incident reporting platform for
                educational institutions. Report incidents
                confidentially, track status, and help create
                a safer learning environment.
              </p>

            </div>

            {/* TRUST INDICATORS */}

            <div className="trust-indicators">

              <div className="trust-item">
                <Shield size={20} />

                <span>
                  Secure & Confidential
                </span>
              </div>

              <div className="trust-item">
                <Shield size={20} />

                <span>
                  Anonymous Reporting
                </span>
              </div>

              <div className="trust-item">
                <Shield size={20} />

                <span>
                  Track Report Status
                </span>
              </div>

            </div>

          </div>

        </div>



        <div className="login-form-section">

          <div className="login-form-container">

            {/* HEADER */}

            <div className="form-header">

              <h2>
                Welcome Back
              </h2>

              <p>
                Sign in to your account
              </p>

            </div>

        

            <form
              className="login-form"
              onSubmit={handleSubmit}
            >

              {/* EMAIL */}

              <div className="form-group">

                <label
                  className="label label-required"
                  htmlFor="email"
                >
                  Email
                </label>

                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`input ${
                    errors.email
                      ? "input-error"
                      : ""
                  }`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />

                {errors.email && (
                  <div className="error-message">

                    <AlertCircle size={16} />

                    <span>
                      {errors.email}
                    </span>

                  </div>
                )}

              </div>

              {/* PASSWORD */}

              <div className="form-group">

                <label
                  className="label label-required"
                  htmlFor="password"
                >
                  Password
                </label>

                <div className="password-input-wrapper">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    id="password"
                    name="password"
                    className={`input ${
                      errors.password
                        ? "input-error"
                        : ""
                    }`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>

                </div>

                {errors.password && (
                  <div className="error-message">

                    <AlertCircle size={16} />

                    <span>
                      {errors.password}
                    </span>

                  </div>
                )}

              </div>

              {/* LOGIN ERROR */}

              {errors.login && (
                <div className="login-error">

                  <AlertCircle size={18} />

                  <span>
                    {errors.login}
                  </span>

                </div>
              )}

              {/* OPTIONS */}

              <div className="form-options">

                <label className="checkbox-label">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    Remember me
                  </span>

                </label>

                <Link
                  to="/forgot-password"
                  className="forgot-password"
                >
                  Forgot password?
                </Link>

              </div>

              {/* SIGN IN BUTTON */}

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
              >
                Sign In
              </button>

            </form>

            {/* FOOTER */}

            <div className="form-footer">

              <p>

                Don't have an account?{" "}

                <Link
                  to="/signup"
                  className="register-link"
                >
                  Create an account
                </Link>

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default LoginPage;