import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  GraduationCap,
  BriefcaseBusiness,
  ArrowRight,
  LockKeyhole,
  UserCog,
} from "lucide-react";

import "../styles/SignupPage.css";

function SignupPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    staffId: "",
    adminId: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    year: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("Please select a role.");
      return;
    }

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (role === "student") {
      if (!formData.studentId || !formData.department || !formData.year) {
        setError("Please fill in all student details.");
        return;
      }
    }

    if (role === "staff") {
      if (!formData.staffId || !formData.department) {
        setError("Please fill in all staff details.");
        return;
      }
    }

    if (role === "administrator") {
      if (!formData.adminId) {
        setError("Please fill in all administrator details.");
        return;
      }
    }

    const existingUsers =
      JSON.parse(localStorage.getItem("sentraUsers")) || [];

    const emailExists = existingUsers.some(
      (user) => user.email.toLowerCase() === formData.email.toLowerCase()
    );

    if (emailExists) {
      setError("An account with this email already exists.");
      return;
    }

    const newUser = {
      id: Date.now(),
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      role,
      ...(role === "student" && {
        studentId: formData.studentId,
        department: formData.department,
        year: formData.year,
      }),
      ...(role === "staff" && {
        staffId: formData.staffId,
        department: formData.department,
      }),
      ...(role === "administrator" && {
        adminId: formData.adminId,
      }),
    };

    localStorage.setItem(
      "sentraUsers",
      JSON.stringify([...existingUsers, newUser])
    );

    alert("Account created successfully!");

    navigate("/login");
  };

  return (
    <div className="signup-page">
      {/* NAVBAR */}
      <nav className="signup-navbar">
        <Link to="/" className="signup-logo">
          <div className="signup-logo-icon">
            <ShieldCheck size={28} />
          </div>

          <div>
            <h2>Sentra</h2>
            <span>Campus Safety, Stronger Community</span>
          </div>
        </Link>

        <div className="signup-nav-right">
          <span>Already have an account?</span>

          <Link to="/login" className="login-link">
            Sign In
          </Link>
        </div>
      </nav>

      {/* MAIN */}
      <main className="signup-container">
        <div className="signup-card">
          <div className="signup-header">
            <div className="header-icon">
              <ShieldCheck size={32} />
            </div>

            <h1>Create Your Sentra Account</h1>

            <p>
              Join the Sentra campus safety community. Select your role
              to get started.
            </p>
          </div>

          {/* ROLE SELECTION */}
          <div className="role-section">
            <h3>Select Your Role</h3>

            <div className="role-options">
              <button
                type="button"
                className={`role-card ${
                  role === "student" ? "selected" : ""
                }`}
                onClick={() => handleRoleChange("student")}
              >
                <div className="role-icon">
                  <GraduationCap size={28} />
                </div>

                <strong>Student</strong>
                <span>Report and track incidents</span>
              </button>

              <button
                type="button"
                className={`role-card ${
                  role === "staff" ? "selected" : ""
                }`}
                onClick={() => handleRoleChange("staff")}
              >
                <div className="role-icon">
                  <BriefcaseBusiness size={28} />
                </div>

                <strong>Staff</strong>
                <span>Support campus safety</span>
              </button>

              <button
                type="button"
                className={`role-card ${
                  role === "administrator" ? "selected" : ""
                }`}
                onClick={() => handleRoleChange("administrator")}
              >
                <div className="role-icon">
                  <UserCog size={28} />
                </div>

                <strong>Administrator</strong>
                <span>Manage the platform</span>
              </button>
            </div>
          </div>

          {/* FORM */}
          {role && (
            <form onSubmit={handleSubmit} className="signup-form">
              <div className="form-title">
                <h3>
                  {role === "student"
                    ? "Student Registration"
                    : role === "staff"
                    ? "Staff Registration"
                    : role === "administrator"
                    ? "Administrator Registration"
                    : "Registration"}
                </h3>

                <p>Enter your details below.</p>
              </div>

              {/* FULL NAME */}
              <div className="form-group">
                <label>Full Name *</label>

                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              {/* STUDENT ID */}
              {role === "student" && (
                <div className="form-group">
                  <label>Student ID *</label>

                  <input
                    type="text"
                    name="studentId"
                    placeholder="Enter your student ID"
                    value={formData.studentId}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* STAFF ID */}
              {role === "staff" && (
                <div className="form-group">
                  <label>Staff ID *</label>

                  <input
                    type="text"
                    name="staffId"
                    placeholder="Enter your staff ID"
                    value={formData.staffId}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* ADMIN ID */}
              {role === "administrator" && (
                <div className="form-group">
                  <label>Admin ID *</label>

                  <input
                    type="text"
                    name="adminId"
                    placeholder="Enter your admin ID"
                    value={formData.adminId}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* EMAIL */}
              <div className="form-group">
                <label>Email Address *</label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* DEPARTMENT */}
              {(role === "student" || role === "staff") && (
                <div className="form-group">
                  <label>Department *</label>

                  <input
                    type="text"
                    name="department"
                    placeholder="Enter your department"
                    value={formData.department}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* YEAR */}
              {role === "student" && (
                <div className="form-group">
                  <label>Year *</label>

                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                  >
                    <option value="">Select Year</option>
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Fourth Year">Fourth Year</option>
                  </select>
                </div>
              )}

              {/* PASSWORD */}
              <div className="form-group">
                <label>Password *</label>

                <input
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="form-group">
                <label>Confirm Password *</label>

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="security-note">
                <LockKeyhole size={18} />

                <span>
                  Your information is protected and kept confidential.
                </span>
              </div>

              <button type="submit" className="create-account-btn">
                Create Account
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default SignupPage;