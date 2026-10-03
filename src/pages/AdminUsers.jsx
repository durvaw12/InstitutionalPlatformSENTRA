import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Settings,
  Search,
  ArrowLeft,
  MoreVertical,
  Plus,
  Mail,
  Calendar,
  X as CloseIcon,
  Edit,
  Check,
  Trash2
} from 'lucide-react';
import '../styles/designSystem.css';
import '../styles/adminDashboard.css';
import '../styles/AdminUsers.css';

function AdminUsers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [addUserError, setAddUserError] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserError, setEditUserError] = useState('');

  // Mock data
  const initialUsers = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@campus.edu',
      role: 'student',
      status: 'active',
      joinedDate: '2026-01-15',
      reportsSubmitted: 3,
      lastActive: '2026-08-15'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.j@campus.edu',
      role: 'student',
      status: 'active',
      joinedDate: '2026-02-20',
      reportsSubmitted: 7,
      lastActive: '2026-08-14'
    },
    {
      id: 3,
      name: 'Dr. Michael Brown',
      email: 'm.brown@campus.edu',
      role: 'staff',
      status: 'active',
      joinedDate: '2026-01-10',
      reportsSubmitted: 12,
      lastActive: '2026-08-15'
    },
    {
      id: 4,
      name: 'Emily Davis',
      email: 'emily.d@campus.edu',
      role: 'student',
      status: 'inactive',
      joinedDate: '2026-03-05',
      reportsSubmitted: 1,
      lastActive: '2026-07-20'
    },
    {
      id: 5,
      name: 'Prof. Robert Wilson',
      email: 'r.wilson@campus.edu',
      role: 'staff',
      status: 'active',
      joinedDate: '2026-01-08',
      reportsSubmitted: 8,
      lastActive: '2026-08-13'
    },
    {
      id: 6,
      name: 'Admin User',
      email: 'admin@campus.edu',
      role: 'administrator',
      status: 'active',
      joinedDate: '2026-01-01',
      reportsSubmitted: 0,
      lastActive: '2026-08-15'
    },
    {
      id: 7,
      name: 'Lisa Anderson',
      email: 'lisa.a@campus.edu',
      role: 'student',
      status: 'active',
      joinedDate: '2026-04-12',
      reportsSubmitted: 2,
      lastActive: '2026-08-12'
    },
    {
      id: 8,
      name: 'James Taylor',
      email: 'j.taylor@campus.edu',
      role: 'staff',
      status: 'active',
      joinedDate: '2026-02-28',
      reportsSubmitted: 5,
      lastActive: '2026-08-14'
    }
  ];

  const [users, setUsers] = useState(initialUsers);
  const [usersStorageError, setUsersStorageError] = useState('');
  const [usersStorageUnavailable, setUsersStorageUnavailable] = useState(false);

  const notifications = [
    {
      id: 1,
      message: 'New user registration: Sarah Johnson',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      message: 'User Emily Davis marked as inactive',
      time: '1 day ago',
      read: false
    },
    {
      id: 3,
      message: 'Monthly user report is ready',
      time: '3 days ago',
      read: true
    }
  ];

  const getRoleBadge = (role) => {
    const roleConfig = {
      'student': { className: 'role-student' },
      'staff': { className: 'role-staff' },
      'administrator': { className: 'role-admin' }
    };

    const config = roleConfig[role] || roleConfig['student'];

    return (
      <span className={`role-badge ${config.className}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { className: 'badge-success', icon: CheckCircle },
      'inactive': { className: 'badge-warning', icon: Clock }
    };

    const config = statusConfig[status] || statusConfig['active'];
    const Icon = config.icon;

    return (
      <span className={`badge ${config.className}`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleLogout = () => {
    navigate('/login');
  };

  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('sentraUsers');
      if (storedUsers === null) return;

      const parsedUsers = JSON.parse(storedUsers);
      if (!Array.isArray(parsedUsers) || parsedUsers.some(user => !user || typeof user !== 'object')) {
        throw new Error('Stored user data must be an array of user records.');
      }

      setUsers(parsedUsers.map(user => {
        const name = user.fullName || user.name || 'Unnamed user';
        const joinedDate = user.joinedDate || new Date().toISOString().split('T')[0];
        return {
          ...user,
          name,
          fullName: name,
          email: user.email || '',
          role: user.role || 'student',
          status: user.status || 'active',
          joinedDate,
          lastActive: user.lastActive || joinedDate,
          reportsSubmitted: user.reportsSubmitted ?? 0
        };
      }));
    } catch (error) {
      console.error('Unable to load saved users.', error);
      setUsersStorageUnavailable(true);
      setUsersStorageError('Saved user data could not be loaded. Changes are disabled to protect the existing data.');
    }
  }, []);

  const persistUsers = (updatedUsers) => {
    if (usersStorageUnavailable) return false;

    try {
      const storedUsers = updatedUsers.map(({ name, ...user }) => ({
        ...user,
        fullName: user.fullName || name
      }));
      localStorage.setItem('sentraUsers', JSON.stringify(storedUsers));
      setUsers(updatedUsers);
      setUsersStorageError('');
      return true;
    } catch (error) {
      console.error('Unable to save user changes.', error);
      setUsersStorageError('User changes could not be saved. Please check browser storage and try again.');
      return false;
    }
  };

  const handleAddUser = () => {
    setAddUserError('');

    const fullName = newUser.fullName.trim();
    const email = newUser.email.trim();
    if (!fullName || !email || !newUser.password || !newUser.role) {
      setAddUserError('Please fill in all fields');
      return;
    }

    if (newUser.password.length < 6) {
      setAddUserError('Password must be at least 6 characters');
      return;
    }

    const emailExists = users.some(
      user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      setAddUserError('A user with this email already exists');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const userToAdd = {
      id: Date.now(),
      name: fullName,
      fullName,
      email,
      password: newUser.password,
      role: newUser.role,
      status: 'active',
      joinedDate: today,
      lastActive: today,
      reportsSubmitted: 0
    };

    if (!persistUsers([...users, userToAdd])) {
      setAddUserError('The user could not be saved. Please try again.');
      return;
    }

    setShowAddUserModal(false);
    setNewUser({
      fullName: '',
      email: '',
      password: '',
      role: 'student'
    });
  };

  const handleNewUserChange = (e) => {
    setNewUser({
      ...newUser,
      [e.target.name]: e.target.value
    });
  };

  const handleEditUserChange = (e) => {
    setEditingUser({
      ...editingUser,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateUser = () => {
    setEditUserError('');

    const fullName = editingUser.fullName.trim();
    const email = editingUser.email.trim();
    if (!fullName || !email || !editingUser.role) {
      setEditUserError('Please fill in all required fields');
      return;
    }

    const emailExists = users.some(
      user => user.id !== editingUser.id && user.email.toLowerCase() === email.toLowerCase()
    );
    if (emailExists) {
      setEditUserError('A user with this email already exists');
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          name: fullName,
          fullName,
          email,
          role: editingUser.role
        };
      }
      return u;
    });

    if (!persistUsers(updatedUsers)) {
      setEditUserError('The user could not be saved. Please try again.');
      return;
    }

    setShowEditUserModal(false);
    setEditingUser(null);
  };

  const handleDropdownToggle = (userId, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === userId ? null : userId);
  };

  const handleDropdownAction = (action, userId) => {
    setActiveDropdown(null);

    const user = users.find(u => u.id === userId);
    if (!user) return;

    switch(action) {
      case 'edit':
        setEditingUser({ ...user, fullName: user.fullName || user.name });
        setShowEditUserModal(true);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this user?')) {
          persistUsers(users.filter(u => u.id !== userId));
        }
        break;
      case 'activate':
        persistUsers(users.map(u => u.id === userId ? { ...u, status: 'active' } : u));
        break;
      case 'deactivate':
        persistUsers(users.map(u => u.id === userId ? { ...u, status: 'inactive' } : u));
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    if (activeDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [activeDropdown]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    staff: users.filter(u => u.role === 'staff').length,
    administrators: users.filter(u => u.role === 'administrator').length,
    active: users.filter(u => u.status === 'active').length
  };

  return (
    <div className="admin-dashboard-container admin-users-page">
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
                <span className="notification-badge">2</span>
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
              <h1>User Management</h1>
              <p>Manage all users in the system</p>
            </div>
            <div className="header-actions">
              <button
                className="btn btn-primary"
                onClick={() => setShowAddUserModal(true)}
              >
                <Plus size={16} />
                Add New User
              </button>
            </div>
          </div>

          {usersStorageError && (
            <div className="admin-data-error" role="alert">
              <AlertCircle size={18} />
              <span>{usersStorageError}</span>
            </div>
          )}

          {/* Stats Overview */}
          <section className="stats-section">
            <div className="stats-grid stats-grid-4">
              <div className="stat-card stat-total">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.total}</h3>
                  <p>Total Users</p>
                </div>
              </div>

              <div className="stat-card stat-pending">
                <div className="stat-icon">
                  <User size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.students}</h3>
                  <p>Students</p>
                </div>
              </div>

              <div className="stat-card stat-review">
                <div className="stat-icon">
                  <User size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.staff}</h3>
                  <p>Staff</p>
                </div>
              </div>

              <div className="stat-card stat-anonymous">
                <div className="stat-icon">
                  <Shield size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.administrators}</h3>
                  <p>Administrators</p>
                </div>
              </div>
            </div>
          </section>

          {/* Filters and Search */}
          <section className="filters-section">
            <div className="filters-header">
              <div className="search-wrapper">
                <Search size={18} />
                <input
                  type="text"
                  className="input"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-controls">
                <select
                  className="select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="administrator">Administrator</option>
                </select>

                <select
                  className="select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </section>

          {/* Users Table */}
          <section className="users-section">
            <div className="table-container">
              <table className="table users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined Date</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="user-cell">
                        <div className="user-avatar-placeholder-sm">
                          <User size={16} />
                        </div>
                        <span className="user-name">{user.name}</span>
                      </td>
                      <td className="email-cell">
                        {user.email}
                      </td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{getStatusBadge(user.status)}</td>
                      <td className="date-cell">
                        {new Date(user.joinedDate).toLocaleDateString()}
                      </td>
                      <td className="date-cell">
                        {new Date(user.lastActive).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="dropdown-wrapper">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => handleDropdownToggle(user.id, e)}
                            title="More Options"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeDropdown === user.id && (
                            <div className="action-dropdown">
                              <button
                                className="dropdown-item"
                                onClick={() => handleDropdownAction('edit', user.id)}
                              >
                                <Edit size={16} />
                                Edit User
                              </button>
                              {user.status === 'active' ? (
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleDropdownAction('deactivate', user.id)}
                                >
                                  <X size={16} />
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleDropdownAction('activate', user.id)}
                                >
                                  <Check size={16} />
                                  Activate
                                </button>
                              )}
                              <button
                                className="dropdown-item"
                                onClick={() => handleDropdownAction('delete', user.id)}
                                style={{ color: 'var(--color-error-600)' }}
                              >
                                <Trash2 size={16} />
                                Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="empty-state">
                  <AlertCircle size={48} />
                  <h3>No users found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New User</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowAddUserModal(false)}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="modal-body">
              {addUserError && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  <span>{addUserError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="label label-required">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  className="input"
                  placeholder="Enter full name"
                  value={newUser.fullName}
                  onChange={handleNewUserChange}
                />
              </div>

              <div className="form-group">
                <label className="label label-required">Email</label>
                <input
                  type="email"
                  name="email"
                  className="input"
                  placeholder="Enter email address"
                  value={newUser.email}
                  onChange={handleNewUserChange}
                />
              </div>

              <div className="form-group">
                <label className="label label-required">Password</label>
                <input
                  type="password"
                  name="password"
                  className="input"
                  placeholder="Create password"
                  value={newUser.password}
                  onChange={handleNewUserChange}
                />
              </div>

              <div className="form-group">
                <label className="label label-required">Role</label>
                <select
                  name="role"
                  className="select"
                  value={newUser.role}
                  onChange={handleNewUserChange}
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="administrator">Administrator</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddUserModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddUser}
              >
                Save User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit User</h2>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                  setEditUserError('');
                }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="modal-body">
              {editUserError && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  <span>{editUserError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="label label-required">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  className="input"
                  placeholder="Enter full name"
                  value={editingUser.fullName || editingUser.name}
                  onChange={handleEditUserChange}
                />
              </div>

              <div className="form-group">
                <label className="label label-required">Email</label>
                <input
                  type="email"
                  name="email"
                  className="input"
                  placeholder="Enter email address"
                  value={editingUser.email}
                  onChange={handleEditUserChange}
                />
              </div>

              <div className="form-group">
                <label className="label label-required">Role</label>
                <select
                  name="role"
                  className="select"
                  value={editingUser.role}
                  onChange={handleEditUserChange}
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="administrator">Administrator</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                  setEditUserError('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdateUser}
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;