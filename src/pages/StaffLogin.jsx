import { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/designSystem.css';
import '../styles/staffLogin.css';

function StaffLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const features = [
    'Department incident dashboard',
    'Real-time incident alerts',
    'Student support coordination',
    'Secure report management'
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Mock login logic - in real app, this would call an API
      console.log('Staff login attempt:', formData);
      
      // Create staff user object and save to localStorage
      const staffUser = {
        email: formData.email,
        name: 'Staff Member',
        role: 'staff',
        department: 'Campus Security', // Default department for demo
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('sentraCurrentUser', JSON.stringify(staffUser));
      localStorage.setItem('user', JSON.stringify(staffUser)); // For StaffDashboard compatibility
      
      navigate('/staff/dashboard');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="staff-login-container">
      <div className="staff-login-split-screen">
        {/* Left Side - Branding */}
        <div className="staff-login-branding">
          <div className="branding-content">
            <div className="logo-section">
              <div className="logo-icon">
                <Shield size={48} />
              </div>
              <h1 className="logo-text">Sentra Staff Portal</h1>
            </div>
            
            <div className="branding-message">
              <h2>Empowering staff to protect every student</h2>
              <p>
                Access your department's safety overview, manage incident reports, 
                and coordinate support for your campus community.
              </p>
            </div>

            <div className="features-list">
              {features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <Check size={20} />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="staff-login-form-section">
          <div className="login-form-container">
            <button className="back-to-landing" onClick={() => navigate('/')}>
              <ArrowLeft size={16} />
              Back to Role Selection
            </button>

            <div className="form-header">
              <h2>Staff Portal Login</h2>
              <p>Sign in to access your department dashboard</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label label-required" htmlFor="email">
                  Staff Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="your.staff@university.edu"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                {errors.email && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {errors.email}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="label label-required" htmlFor="password">
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {errors.password}
                  </div>
                )}
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <a href="/forgot-password" className="forgot-password">
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-full">
                Sign In to Staff Portal
              </button>

              <div className="department-selector">
                <p>Select your department:</p>
                <select className="select">
                  <option>Student Affairs</option>
                  <option>Academic Affairs</option>
                  <option>Residential Life</option>
                  <option>Campus Security</option>
                  <option>Health Services</option>
                  <option>Counseling Services</option>
                </select>
              </div>
            </form>

            <div className="form-footer">
              <p>
                Need access?{' '}
                <a href="/contact" className="register-link">
                  Contact your department administrator
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffLogin;