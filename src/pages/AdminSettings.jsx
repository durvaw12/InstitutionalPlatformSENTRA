import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  BarChart3,
  FileText,
  Users,
  Settings,
  ArrowLeft,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Lock,
  Globe,
  Mail,
  Smartphone,
  Database,
  ShieldCheck
} from 'lucide-react';
import '../styles/designSystem.css';
import '../styles/adminDashboard.css';

const DEFAULT_SETTINGS = {
  general: {
    siteName: 'Sentra',
    siteDescription: 'Campus Safety, Stronger Community',
    adminEmail: 'admin@campus.edu',
    timezone: 'America/New_York',
    language: 'en',
    maintenanceMode: false
  },
  security: {
    twoFactorAuth: true,
    passwordMinLength: 8,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    ipWhitelist: '',
    enableAuditLog: true
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newReportAlert: true,
    statusUpdateAlert: true,
    weeklySummary: true,
    criticalAlert: true
  },
  system: {
    maxFileSize: 10,
    allowedFileTypes: 'jpg,png,pdf,doc,docx',
    dataRetentionDays: 365,
    autoBackup: true,
    backupFrequency: 'daily',
    apiRateLimit: 1000
  }
};

function AdminSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [saveStatus, setSaveStatus] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [generalSettings, setGeneralSettings] = useState(DEFAULT_SETTINGS.general);
  const [securitySettings, setSecuritySettings] = useState(DEFAULT_SETTINGS.security);
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_SETTINGS.notifications);
  const [systemSettings, setSystemSettings] = useState(DEFAULT_SETTINGS.system);

  const notifications = [
    {
      id: 1,
      message: 'System backup completed successfully',
      time: '1 hour ago',
      read: false
    },
    {
      id: 2,
      message: 'Settings updated by Admin User',
      time: '3 hours ago',
      read: true
    },
    {
      id: 3,
      message: 'Security scan completed - no threats found',
      time: '1 day ago',
      read: true
    }
  ];

  const handleLogout = () => {
    navigate('/login');
  };

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('sentraAdminSettings');
      if (storedSettings === null) return;

      const parsedSettings = JSON.parse(storedSettings);
      if (!parsedSettings || typeof parsedSettings !== 'object' || Array.isArray(parsedSettings)) {
        throw new Error('Stored settings must be an object.');
      }

      const getSection = (key) => {
        const section = parsedSettings[key];
        if (section === undefined) return DEFAULT_SETTINGS[key];
        if (!section || typeof section !== 'object' || Array.isArray(section)) {
          throw new Error(`Stored ${key} settings must be an object.`);
        }
        return { ...DEFAULT_SETTINGS[key], ...section };
      };

      setGeneralSettings(getSection('general'));
      setSecuritySettings(getSection('security'));
      setNotificationSettings(getSection('notifications'));
      setSystemSettings(getSection('system'));
    } catch (error) {
      console.error('Unable to load saved admin settings.', error);
      setSettingsError('Saved settings could not be loaded. Reset to defaults or save valid settings to replace them.');
      setSaveStatus('error');
    }
  }, []);

  const persistSettings = (settings) => {
    try {
      localStorage.setItem('sentraAdminSettings', JSON.stringify(settings));
      setSettingsError('');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
      return true;
    } catch (error) {
      console.error('Unable to save admin settings.', error);
      setSettingsError('Settings could not be saved. Please check browser storage and try again.');
      setSaveStatus('error');
      return false;
    }
  };

  const handleSaveSettings = () => {
    setSaveStatus('saving');
    persistSettings({
      general: generalSettings,
      security: securitySettings,
      notifications: notificationSettings,
      system: systemSettings
    });
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSaveStatus('resetting');

      const defaults = {
        general: { ...DEFAULT_SETTINGS.general },
        security: { ...DEFAULT_SETTINGS.security },
        notifications: { ...DEFAULT_SETTINGS.notifications },
        system: { ...DEFAULT_SETTINGS.system }
      };
      if (!persistSettings(defaults)) return;

      setGeneralSettings(defaults.general);
      setSecuritySettings(defaults.security);
      setNotificationSettings(defaults.notifications);
      setSystemSettings(defaults.system);
    }
  };

  const settingsSections = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Database }
  ];

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="logo">
            <Shield size={32} />
            <span>Sentra Admin</span>
          </div>
        </div>

        <nav className={`admin-nav ${showMobileMenu ? 'show' : ''}`}>
          <Link to="/admin/dashboard" className={`nav-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}>
            <BarChart3 size={18} />
            Overview
          </Link>
          <Link to="/admin/incidents" className={`nav-item ${location.pathname === '/admin/incidents' ? 'active' : ''}`}>
            <FileText size={18} />
            Incidents
          </Link>
          <Link to="/admin/users" className={`nav-item ${location.pathname === '/admin/users' ? 'active' : ''}`}>
            <Users size={18} />
            Users
          </Link>
          <Link to="/admin/settings" className={`nav-item ${location.pathname === '/admin/settings' ? 'active' : ''}`}>
            <Settings size={18} />
            Settings
          </Link>
        </nav>

        <div className="header-right">
          <div className="notification-wrapper">
            <button
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} />
              {notifications.some(n => !n.read) && (
                <span className="notification-badge">1</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h4>Notifications</h4>
                  <button className="mark-read-btn">Mark all as read</button>
                </div>
                <div className="notification-list">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    >
                      <p>{notification.message}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="user-menu">
            <button className="user-btn">
              <div className="user-avatar-placeholder">
                <User size={20} />
              </div>
              <div className="user-info">
                <span className="user-name">Admin User</span>
                <span className="user-role">Administrator</span>
              </div>
            </button>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <div className="container">
          {/* Page Header */}
          <div className="page-header">
            <div className="header-left-content">
              <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
                <ArrowLeft size={20} />
                Back to Dashboard
              </button>
              <h1>Settings</h1>
              <p>Configure system settings and preferences</p>
            </div>
            <div className="header-actions">
              {saveStatus === 'success' && (
                <div className="save-success">
                  <CheckCircle size={16} />
                  Settings saved successfully
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="save-error" role="alert">
                  <AlertCircle size={16} />
                  {settingsError}
                </div>
              )}
              <button
                className="btn btn-secondary"
                onClick={handleResetSettings}
                disabled={saveStatus === 'saving' || saveStatus === 'resetting'}
              >
                <RefreshCw size={16} />
                Reset to Default
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveSettings}
                disabled={saveStatus === 'saving' || saveStatus === 'resetting'}
              >
                {saveStatus === 'saving' || saveStatus === 'resetting' ? (
                  <>
                    <RefreshCw size={16} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Settings Layout */}
          <div className="settings-layout">
            {/* Settings Navigation */}
            <aside className="settings-nav">
              {settingsSections.map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon size={18} />
                    {section.label}
                  </button>
                );
              })}
            </aside>

            {/* Settings Content */}
            <div className="settings-content">
              {/* General Settings */}
              {activeSection === 'general' && (
                <div className="settings-section">
                  <h2>General Settings</h2>
                  <div className="settings-form">
                    <div className="form-group">
                      <label className="label">Site Name</label>
                      <input
                        type="text"
                        className="input"
                        value={generalSettings.siteName}
                        onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Site Description</label>
                      <textarea
                        className="input"
                        rows="3"
                        value={generalSettings.siteDescription}
                        onChange={(e) => setGeneralSettings({...generalSettings, siteDescription: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Admin Email</label>
                      <div className="input-with-icon">
                        <Mail size={18} />
                        <input
                          type="email"
                          className="input"
                          value={generalSettings.adminEmail}
                          onChange={(e) => setGeneralSettings({...generalSettings, adminEmail: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="label">Timezone</label>
                      <select
                        className="select"
                        value={generalSettings.timezone}
                        onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="label">Language</label>
                      <select
                        className="select"
                        value={generalSettings.language}
                        onChange={(e) => setGeneralSettings({...generalSettings, language: e.target.value})}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>

                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={generalSettings.maintenanceMode}
                          onChange={(e) => setGeneralSettings({...generalSettings, maintenanceMode: e.target.checked})}
                        />
                        <span>Maintenance Mode</span>
                      </label>
                      <p className="form-help">Enable maintenance mode to restrict access to administrators only</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeSection === 'security' && (
                <div className="settings-section">
                  <h2>Security Settings</h2>
                  <div className="settings-form">
                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={securitySettings.twoFactorAuth}
                          onChange={(e) => setSecuritySettings({...securitySettings, twoFactorAuth: e.target.checked})}
                        />
                        <span>Two-Factor Authentication</span>
                      </label>
                      <p className="form-help">Require 2FA for all administrator accounts</p>
                    </div>

                    <div className="form-group">
                      <label className="label">Minimum Password Length</label>
                      <input
                        type="number"
                        className="input"
                        min="6"
                        max="20"
                        value={securitySettings.passwordMinLength}
                        onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        className="input"
                        min="5"
                        max="120"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Maximum Login Attempts</label>
                      <input
                        type="number"
                        className="input"
                        min="3"
                        max="10"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">IP Whitelist (comma-separated)</label>
                      <textarea
                        className="input"
                        rows="3"
                        placeholder="192.168.1.1, 10.0.0.1"
                        value={securitySettings.ipWhitelist}
                        onChange={(e) => setSecuritySettings({...securitySettings, ipWhitelist: e.target.value})}
                      />
                      <p className="form-help">Leave empty to allow all IP addresses</p>
                    </div>

                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={securitySettings.enableAuditLog}
                          onChange={(e) => setSecuritySettings({...securitySettings, enableAuditLog: e.target.checked})}
                        />
                        <span>Enable Audit Log</span>
                      </label>
                      <p className="form-help">Log all administrative actions for security auditing</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <div className="settings-section">
                  <h2>Notification Settings</h2>
                  <div className="settings-form">
                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                        />
                        <span>Email Notifications</span>
                      </label>
                      <p className="form-help">Receive notifications via email</p>
                    </div>

                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notificationSettings.pushNotifications}
                          onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                        />
                        <span>Push Notifications</span>
                      </label>
                      <p className="form-help">Receive push notifications in browser</p>
                    </div>

                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notificationSettings.smsNotifications}
                          onChange={(e) => setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked})}
                        />
                        <span>SMS Notifications</span>
                      </label>
                      <p className="form-help">Receive notifications via SMS</p>
                    </div>

                    <h3>Alert Types</h3>

                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notificationSettings.newReportAlert}
                          onChange={(e) => setNotificationSettings({...notificationSettings, newReportAlert: e.target.checked})}
                        />
                        <span>New Report Alert</span>
                      </label>
                      <p className="form-help">Notify when new incidents are reported</p>
                    </div>

                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notificationSettings.statusUpdateAlert}
                          onChange={(e) => setNotificationSettings({...notificationSettings, statusUpdateAlert: e.target.checked})}
                        />
                        <span>Status Update Alert</span>
                      </label>
                      <p className="form-help">Notify when incident status changes</p>
                    </div>

                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notificationSettings.weeklySummary}
                          onChange={(e) => setNotificationSettings({...notificationSettings, weeklySummary: e.target.checked})}
                        />
                        <span>Weekly Summary</span>
                      </label>
                      <p className="form-help">Receive weekly summary reports</p>
                    </div>

                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={notificationSettings.criticalAlert}
                          onChange={(e) => setNotificationSettings({...notificationSettings, criticalAlert: e.target.checked})}
                        />
                        <span>Critical Alert</span>
                      </label>
                      <p className="form-help">Immediate notification for critical incidents</p>
                    </div>
                  </div>
                </div>
              )}

              {/* System Settings */}
              {activeSection === 'system' && (
                <div className="settings-section">
                  <h2>System Settings</h2>
                  <div className="settings-form">
                    <div className="form-group">
                      <label className="label">Maximum File Size (MB)</label>
                      <input
                        type="number"
                        className="input"
                        min="1"
                        max="50"
                        value={systemSettings.maxFileSize}
                        onChange={(e) => setSystemSettings({...systemSettings, maxFileSize: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Allowed File Types</label>
                      <input
                        type="text"
                        className="input"
                        value={systemSettings.allowedFileTypes}
                        onChange={(e) => setSystemSettings({...systemSettings, allowedFileTypes: e.target.value})}
                      />
                      <p className="form-help">Comma-separated file extensions (e.g., jpg,png,pdf)</p>
                    </div>

                    <div className="form-group">
                      <label className="label">Data Retention Period (days)</label>
                      <input
                        type="number"
                        className="input"
                        min="30"
                        max="3650"
                        value={systemSettings.dataRetentionDays}
                        onChange={(e) => setSystemSettings({...systemSettings, dataRetentionDays: parseInt(e.target.value)})}
                      />
                      <p className="form-help">How long to keep incident reports before archiving</p>
                    </div>

                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={systemSettings.autoBackup}
                          onChange={(e) => setSystemSettings({...systemSettings, autoBackup: e.target.checked})}
                        />
                        <span>Automatic Backup</span>
                      </label>
                      <p className="form-help">Enable automatic system backups</p>
                    </div>

                    <div className="form-group">
                      <label className="label">Backup Frequency</label>
                      <select
                        className="select"
                        value={systemSettings.backupFrequency}
                        onChange={(e) => setSystemSettings({...systemSettings, backupFrequency: e.target.value})}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="label">API Rate Limit (requests per minute)</label>
                      <input
                        type="number"
                        className="input"
                        min="100"
                        max="10000"
                        value={systemSettings.apiRateLimit}
                        onChange={(e) => setSystemSettings({...systemSettings, apiRateLimit: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminSettings;