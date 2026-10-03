import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Search,
  Plus,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  TrendingUp,
  Eye,
  Users,
  MapPin,
  Calendar,
  Send,
  Filter,
  ArrowLeft,
  Download,
} from 'lucide-react';

import '../styles/designSystem.css';
import '../styles/staffDashboard.css';

function StaffDashboard() {
  const navigate = useNavigate();

  /* =========================================================
     EXISTING STATES
  ========================================================= */

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] =
    useState(false);

  const [selectedDepartment, setSelectedDepartment] =
    useState('Student Affairs');

  const departments = [
    'Student Affairs',
    'Academic Affairs',
    'Residential Life',
    'Campus Security',
    'Health Services',
    'Counseling Services',
    'IT Department',
  ];

  /* =========================================================
     CURRENT USER
  ========================================================= */

  const [currentUser, setCurrentUser] = useState(null);

  /* =========================================================
     DASHBOARD DATA
  ========================================================= */

  const [stats, setStats] = useState({
    openCases: 0,
    needsAttention: 0,
    pendingReview: 0,
    resolved: 0,
  });

  const [urgentItems, setUrgentItems] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [incidentsByCategory, setIncidentsByCategory] =
    useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* =========================================================
     DEPARTMENT REPORTS
  ========================================================= */

  const [showDepartmentReports, setShowDepartmentReports] =
    useState(false);

  const [departmentIncidents, setDepartmentIncidents] =
    useState([]);

  const [selectedIncident, setSelectedIncident] =
    useState(null);

  const [incidentSearch, setIncidentSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('All Statuses');

  const [priorityFilter, setPriorityFilter] =
    useState('All Priorities');

  const [responseText, setResponseText] =
    useState('');

  const [resolutionSubmitting, setResolutionSubmitting] =
    useState(false);

  /* =========================================================
     EXPORT FUNCTIONALITY
  ========================================================= */

  const [showExportOptions, setShowExportOptions] = useState(false);

  const handleExportCSV = () => {
    const csvContent = [
      [
        'Reference ID',
        'Category',
        'Location',
        'Date',
        'Priority',
        'Status',
        'Description',
        'Assigned Department',
        'Staff Response'
      ],
      ...filteredDepartmentIncidents.map(incident => [
        incident.referenceId || incident.id,
        incident.category,
        incident.location,
        incident.date || incident.createdAt,
        incident.priority,
        incident.status,
        `"${incident.description || ''}"`,
        incident.assignedDepartment || incident.department,
        `"${incident.staffResponse || ''}"`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `department-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(filteredDepartmentIncidents, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `department-reports-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };

  /* =========================================================
     TIME-BASED FILTERING
  ========================================================= */

  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const getFilteredByDate = (incidents) => {
    if (!dateRange.startDate && !dateRange.endDate) {
      return incidents;
    }

    return incidents.filter(incident => {
      const incidentDate = new Date(incident.date || incident.createdAt);
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

      if (startDate && incidentDate < startDate) return false;
      if (endDate && incidentDate > endDate) return false;

      return true;
    });
  };

  /* =========================================================
     BULK ACTIONS
  ========================================================= */

  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const handleSelectIncident = (incidentId) => {
    setSelectedIncidents(prev => 
      prev.includes(incidentId) 
        ? prev.filter(id => id !== incidentId)
        : [...prev, incidentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIncidents.length === filteredByDate.length) {
      setSelectedIncidents([]);
    } else {
      setSelectedIncidents(filteredByDate.map(inc => inc.id || inc.referenceId));
    }
  };

  const handleBulkStatusUpdate = (newStatus) => {
    if (selectedIncidents.length === 0) return;

    try {
      const stored = localStorage.getItem('sentraIncidents');
      const incidents = stored ? JSON.parse(stored) : [];

      const updatedIncidents = incidents.map(incident => {
        if (selectedIncidents.includes(incident.id || incident.referenceId)) {
          return {
            ...incident,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            timeline: [
              ...(incident.timeline || []),
              {
                status: newStatus,
                date: new Date().toISOString(),
                description: `Status updated to ${newStatus} (bulk update)`
              }
            ]
          };
        }
        return incident;
      });

      localStorage.setItem('sentraIncidents', JSON.stringify(updatedIncidents));
      setSelectedIncidents([]);
      setShowBulkActions(false);
      loadDepartmentData();
      alert(`Updated ${selectedIncidents.length} incidents to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update incidents:', error);
      alert('Failed to update incidents');
    }
  };

  /* =========================================================
     LOAD CURRENT USER
  ========================================================= */

  useEffect(() => {
    try {
      // Try both localStorage keys for compatibility
      const storedUser = localStorage.getItem('user') || localStorage.getItem('sentraCurrentUser');

      if (storedUser) {
        const user = JSON.parse(storedUser);

        setCurrentUser(user);

        /*
         * If user's department exists,
         * automatically select it.
         */
        if (user.department) {
          setSelectedDepartment(user.department);
        }
      }
    } catch (err) {
      console.error(
        'Failed to read current user:',
        err
      );
    }
  }, []);

  /* =========================================================
     LOAD FRONTEND DASHBOARD DATA
     
     NO BACKEND API
     NO /api/staff/dashboard
  ========================================================= */

  /* =========================================================
     INITIALIZE MOCK DATA
  ========================================================= */

  useEffect(() => {
    // Initialize mock data if no incidents exist
    const storedIncidents = localStorage.getItem('sentraIncidents');
    if (!storedIncidents) {
      const mockIncidents = [
        {
          id: 'SNT-2026-001001',
          referenceId: 'SNT-2026-001001',
          category: 'Safety Hazard',
          dateTime: '2026-08-15T14:30',
          location: 'Main Library, 2nd Floor',
          description: 'Broken glass near the entrance creating a tripping hazard.',
          additionalDetails: 'Several students have reported near misses.',
          isAnonymous: false,
          contactName: 'John Doe',
          contactEmail: 'john.doe@university.edu',
          contactPhone: '555-1234',
          status: 'Assigned',
          priority: 'High',
          assignedDepartment: 'Campus Security',
          assignedBy: 'Administrator',
          createdAt: '2026-08-15T14:30:00.000Z',
          updatedAt: '2026-08-15T16:00:00.000Z',
          timeline: [
            { status: 'Submitted', date: '2026-08-15T14:30:00.000Z', description: 'Report submitted successfully' },
            { status: 'Pending', date: '2026-08-15T14:35:00.000Z', description: 'Report received and queued for review' },
            { status: 'Assigned', date: '2026-08-15T16:00:00.000Z', description: 'Assigned to Campus Security' }
          ]
        },
        {
          id: 'SNT-2026-001002',
          referenceId: 'SNT-2026-001002',
          category: 'Facility Issue',
          dateTime: '2026-08-14T09:15',
          location: 'Student Center, Cafeteria',
          description: 'Water leak from ceiling causing flooding in food preparation area.',
          additionalDetails: 'Immediate attention required as it affects food safety.',
          isAnonymous: true,
          contactName: null,
          contactEmail: null,
          contactPhone: null,
          status: 'In Progress',
          priority: 'Critical',
          assignedDepartment: 'Facilities Team',
          assignedBy: 'Administrator',
          createdAt: '2026-08-14T09:15:00.000Z',
          updatedAt: '2026-08-14T10:30:00.000Z',
          timeline: [
            { status: 'Submitted', date: '2026-08-14T09:15:00.000Z', description: 'Anonymous report submitted successfully' },
            { status: 'Pending', date: '2026-08-14T09:20:00.000Z', description: 'Report received and queued for review' },
            { status: 'Assigned', date: '2026-08-14T09:45:00.000Z', description: 'Assigned to Facilities Team' },
            { status: 'In Progress', date: '2026-08-14T10:30:00.000Z', description: 'Facilities team is actively working on the issue' }
          ]
        },
        {
          id: 'SNT-2026-001003',
          referenceId: 'SNT-2026-001003',
          category: 'Harassment',
          dateTime: '2026-08-13T18:45',
          location: 'Dormitory Building B, Common Room',
          description: 'Verbal harassment incident reported between students.',
          additionalDetails: 'Witnesses available. Need immediate investigation.',
          isAnonymous: false,
          contactName: 'Jane Smith',
          contactEmail: 'jane.smith@university.edu',
          contactPhone: '555-5678',
          status: 'Pending',
          priority: 'High',
          assignedDepartment: 'Student Affairs',
          assignedBy: 'Administrator',
          createdAt: '2026-08-13T18:45:00.000Z',
          updatedAt: '2026-08-13T19:00:00.000Z',
          timeline: [
            { status: 'Submitted', date: '2026-08-13T18:45:00.000Z', description: 'Report submitted successfully' },
            { status: 'Pending', date: '2026-08-13T19:00:00.000Z', description: 'Report received and queued for review' }
          ]
        },
        {
          id: 'SNT-2026-001004',
          referenceId: 'SNT-2026-001004',
          category: 'Security Concern',
          dateTime: '2026-08-12T22:00',
          location: 'Parking Lot A, Section 3',
          description: 'Suspicious vehicle parked in restricted area for extended period.',
          additionalDetails: 'Vehicle has been there since yesterday evening.',
          isAnonymous: true,
          contactName: null,
          contactEmail: null,
          contactPhone: null,
          status: 'Resolution Submitted',
          priority: 'Medium',
          assignedDepartment: 'Campus Security',
          assignedBy: 'Administrator',
          staffResponse: 'Security team investigated the vehicle. It belongs to a faculty member who had car trouble and left it overnight. Vehicle has been moved to appropriate parking area.',
          resolutionSubmittedBy: 'Security Officer John',
          resolutionSubmittedAt: '2026-08-13T08:00:00.000Z',
          resolutionPendingAdmin: true,
          createdAt: '2026-08-12T22:00:00.000Z',
          updatedAt: '2026-08-13T08:00:00.000Z',
          timeline: [
            { status: 'Submitted', date: '2026-08-12T22:00:00.000Z', description: 'Anonymous report submitted successfully' },
            { status: 'Pending', date: '2026-08-12T22:05:00.000Z', description: 'Report received and queued for review' },
            { status: 'Assigned', date: '2026-08-12T23:00:00.000Z', description: 'Assigned to Campus Security' },
            { status: 'In Progress', date: '2026-08-13T07:00:00.000Z', description: 'Security team investigating the vehicle' },
            { status: 'Resolution Submitted', date: '2026-08-13T08:00:00.000Z', description: 'Resolution submitted to Admin for review' }
          ]
        },
        {
          id: 'SNT-2026-001005',
          referenceId: 'SNT-2026-001005',
          category: 'Medical Emergency',
          dateTime: '2026-08-10T11:30',
          location: 'Gymnasium, Basketball Court',
          description: 'Student injured during basketball game requiring medical attention.',
          additionalDetails: 'Student was treated by campus medical staff and is recovering.',
          isAnonymous: false,
          contactName: 'Mike Johnson',
          contactEmail: 'mike.johnson@university.edu',
          contactPhone: '555-9012',
          status: 'Resolved',
          priority: 'Critical',
          assignedDepartment: 'Health Services',
          assignedBy: 'Administrator',
          staffResponse: 'Student received immediate medical attention. Minor injury treated and student was released. Follow-up appointment scheduled.',
          resolutionSubmittedBy: 'Dr. Sarah Williams',
          resolutionSubmittedAt: '2026-08-10T14:00:00.000Z',
          adminResponse: 'Case reviewed and marked as resolved. Student follow-up confirmed.',
          createdAt: '2026-08-10T11:30:00.000Z',
          updatedAt: '2026-08-10T16:00:00.000Z',
          timeline: [
            { status: 'Submitted', date: '2026-08-10T11:30:00.000Z', description: 'Report submitted successfully' },
            { status: 'Pending', date: '2026-08-10T11:35:00.000Z', description: 'Report received and queued for review' },
            { status: 'Assigned', date: '2026-08-10T11:45:00.000Z', description: 'Assigned to Health Services' },
            { status: 'In Progress', date: '2026-08-10T12:00:00.000Z', description: 'Medical team providing treatment' },
            { status: 'Resolution Submitted', date: '2026-08-10T14:00:00.000Z', description: 'Resolution submitted to Admin for review' },
            { status: 'Resolved', date: '2026-08-10T16:00:00.000Z', description: 'Admin reviewed and marked as resolved' }
          ]
        }
      ];
      
      localStorage.setItem('sentraIncidents', JSON.stringify(mockIncidents));
      
      // Initialize admin signals
      const mockSignals = [
        {
          id: 'RES-2026-001001',
          incidentId: 'SNT-2026-001004',
          referenceId: 'SNT-2026-001004',
          department: 'Campus Security',
          staffName: 'Security Officer John',
          message: 'Resolution submitted for SNT-2026-001004',
          response: 'Security team investigated the vehicle. It belongs to a faculty member who had car trouble and left it overnight. Vehicle has been moved to appropriate parking area.',
          status: 'Pending Admin Review',
          createdAt: '2026-08-13T08:00:00.000Z',
          read: false
        }
      ];
      
      localStorage.setItem('sentraAdminResolutionSignals', JSON.stringify(mockSignals));
      
      // Initialize staff notifications
      const mockNotifications = [
        {
          id: 1,
          message: 'New incident assigned: SNT-2026-001001',
          time: '2 hours ago',
          read: false
        },
        {
          id: 2,
          message: 'Resolution for SNT-2026-001004 is pending admin review',
          time: '1 day ago',
          read: true
        }
      ];
      
      localStorage.setItem('sentraStaffNotifications', JSON.stringify(mockNotifications));
    }
  }, []);

  const loadDashboardData = useCallback(() => {
    if (!currentUser && !selectedDepartment) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const storedIncidents =
        localStorage.getItem('sentraIncidents');

      const incidents = storedIncidents
        ? JSON.parse(storedIncidents)
        : [];

      const department =
        currentUser?.department ||
        selectedDepartment;

      /*
       * Get only incidents belonging
       * to this department.
       */
      const departmentData = incidents.filter(
        (incident) =>
          incident.assignedDepartment ===
            department ||
          incident.department === department
      );

      /* =====================================================
         STATISTICS
      ===================================================== */

      const openCases =
        departmentData.filter(
          (incident) =>
            incident.status !== 'Resolved'
        ).length;

      const needsAttention =
        departmentData.filter(
          (incident) =>
            (
              incident.priority === 'High' ||
              incident.priority === 'Critical'
            ) &&
            incident.status !== 'Resolved'
        ).length;

      const pendingReview =
        departmentData.filter(
          (incident) =>
            incident.status === 'Assigned' ||
            incident.status === 'Pending' ||
            incident.status === 'In Progress' ||
            incident.status ===
              'Resolution Submitted'
        ).length;

      const resolved =
        departmentData.filter(
          (incident) =>
            incident.status === 'Resolved'
        ).length;

      setStats({
        openCases,
        needsAttention,
        pendingReview,
        resolved,
      });

      /* =====================================================
         URGENT ITEMS
      ===================================================== */

      const urgent =
        departmentData.filter(
          (incident) =>
            (
              incident.priority === 'High' ||
              incident.priority === 'Critical'
            ) &&
            incident.status !== 'Resolved'
        );

      setUrgentItems(urgent);

      /* =====================================================
         PENDING ACTIONS
      ===================================================== */

      const pending =
        departmentData
          .filter(
            (incident) =>
              incident.status === 'Assigned' ||
              incident.status === 'Pending' ||
              incident.status === 'In Progress'
          )
          .map((incident) => ({
            action: 'Review incident',
            reference:
              incident.referenceId ||
              incident.id,
            time:
              incident.date ||
              incident.createdAt ||
              'Recently',
          }));

      setPendingActions(pending);

      /* =====================================================
         RECENT ACTIVITY
      ===================================================== */

      const activity =
        [...departmentData]
          .sort(
            (a, b) =>
              new Date(
                b.createdAt ||
                  b.date ||
                  0
              ) -
              new Date(
                a.createdAt ||
                  a.date ||
                  0
              )
          )
          .slice(0, 10)
          .map((incident) => ({
            id:
              incident.id ||
              incident.referenceId,

            incident:
              incident.referenceId ||
              incident.id,

            date:
              incident.date ||
              incident.createdAt ||
              '—',

            status:
              incident.status ||
              'Assigned',
          }));

      setRecentActivity(activity);

      /* =====================================================
         CATEGORY DATA
      ===================================================== */

      const categoryMap = {};

      departmentData.forEach(
        (incident) => {
          const category =
            incident.category ||
            'Other';

          if (!categoryMap[category]) {
            categoryMap[category] = 0;
          }

          categoryMap[category]++;
        }
      );

      const categoryData =
        Object.entries(
          categoryMap
        ).map(
          ([category, count]) => ({
            category,
            count,
          })
        );

      setIncidentsByCategory(
        categoryData
      );

      /* =====================================================
         NOTIFICATIONS
      ===================================================== */

      const storedNotifications =
        localStorage.getItem(
          'sentraStaffNotifications'
        );

      if (storedNotifications) {
        setNotifications(
          JSON.parse(
            storedNotifications
          )
        );
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error(
        'Failed to load dashboard:',
        err
      );

      setError(
        'Could not load dashboard data.'
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedDepartment]);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [selectedDepartment, currentUser, loadDashboardData]);

  /* =========================================================
     NOTIFICATION COUNT
  ========================================================= */

  const unreadCount =
    notifications.filter(
      (n) => !n.read
    ).length;

  /* =========================================================
     PRIORITY BADGE
  ========================================================= */

  const getPriorityBadge = (
    priority
  ) => {
    const priorityConfig = {
      Critical: {
        className:
          'priority-critical',
      },

      High: {
        className:
          'priority-high',
      },

      Medium: {
        className:
          'priority-medium',
      },

      Low: {
        className:
          'priority-low',
      },
    };

    const config =
      priorityConfig[
        priority
      ] ||
      priorityConfig.Medium;

    return (
      <span
        className={`priority-badge ${config.className}`}
      >
        {priority || 'Medium'}
      </span>
    );
  };

  /* =========================================================
     STATUS BADGE
  ========================================================= */

  const getStatusBadge = (
    status
  ) => {
    const statusConfig = {
      Pending: {
        className:
          'badge-warning',
        icon: Clock,
      },

      Assigned: {
        className:
          'badge-warning',
        icon: Clock,
      },

      'In Progress': {
        className:
          'badge-info',
        icon: Eye,
      },

      'Resolution Submitted': {
        className:
          'badge-info',
        icon: Send,
      },

      Resolved: {
        className:
          'badge-success',
        icon: CheckCircle,
      },
    };

    const config =
      statusConfig[
        status
      ] ||
      statusConfig.Pending;

    const Icon =
      config.icon;

    return (
      <span
        className={`badge ${config.className}`}
      >
        <Icon size={12} />
        {status || 'Pending'}
      </span>
    );
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem(
      'user'
    );

    localStorage.removeItem(
      'sentraCurrentUser'
    );

    localStorage.removeItem(
      'token'
    );

    navigate('/');
  };

  /* =========================================================
     REPORT INCIDENT
  ========================================================= */

  const handleReportIncident = () => {
    navigate(
      '/report-incident'
    );
  };

  /* =========================================================
     EXISTING INCIDENT VIEW
  ========================================================= */

  const handleViewIncident = (
    id
  ) => {
    navigate(
      `/report/${id}`
    );
  };

  /* =========================================================
     MARK NOTIFICATIONS READ
  ========================================================= */

  const handleMarkAllRead = () => {
    const updated =
      notifications.map(
        (notification) => ({
          ...notification,
          read: true,
        })
      );

    setNotifications(
      updated
    );

    localStorage.setItem(
      'sentraStaffNotifications',
      JSON.stringify(updated)
    );
  };

  /* =========================================================
     DEPARTMENT REPORTS
  ========================================================= */

  const handleDepartmentReports =
    () => {
      setShowDepartmentReports(
        true
      );

      setSelectedIncident(
        null
      );

      setResponseText('');

      loadDepartmentData();
    };

  /* =========================================================
     LOAD DEPARTMENT INCIDENTS
  ========================================================= */

  const loadDepartmentData =
    () => {
      try {
        const stored =
          localStorage.getItem(
            'sentraIncidents'
          );

        const incidents =
          stored
            ? JSON.parse(stored)
            : [];

        const department =
          currentUser?.department ||
          selectedDepartment;

        const filtered =
          incidents.filter(
            (incident) =>
              incident.assignedDepartment ===
                department ||
              incident.department ===
                department
          );

        setDepartmentIncidents(
          filtered
        );
      } catch (err) {
        console.error(
          'Failed to load department incidents:',
          err
        );

        setDepartmentIncidents(
          []
        );
      }
    };

  /* =========================================================
     BACK TO DASHBOARD
  ========================================================= */

  const handleBackToDashboard =
    () => {
      setShowDepartmentReports(
        false
      );

      setSelectedIncident(
        null
      );

      setResponseText('');

      loadDashboardData();
    };

  /* =========================================================
     OPEN DEPARTMENT INCIDENT
  ========================================================= */

  const handleOpenDepartmentIncident =
    (incident) => {
      setSelectedIncident(
        incident
      );

      setResponseText(
        incident.staffResponse ||
          incident.resolutionResponse ||
          ''
      );
    };

  /* =========================================================
     STAFF SUBMITS RESOLUTION
     
     IMPORTANT:
     
     Staff does NOT mark Resolved.
     
     Staff changes:
     
     In Progress
          ↓
     Resolution Submitted
     
     Admin later changes:
     
     Resolution Submitted
          ↓
     Resolved
  ========================================================= */

  const handleSubmitResolution =
    () => {
      if (
        !selectedIncident
      ) {
        return;
      }

      if (
        !responseText.trim()
      ) {
        alert(
          'Please describe the action taken before submitting the resolution.'
        );

        return;
      }

      setResolutionSubmitting(
        true
      );

      try {
        const stored =
          localStorage.getItem(
            'sentraIncidents'
          );

        const incidents =
          stored
            ? JSON.parse(stored)
            : [];

        const now =
          new Date().toISOString();

        const updatedIncidents =
          incidents.map(
            (incident) => {
              if (
                incident.id ===
                  selectedIncident.id ||
                incident.referenceId ===
                  selectedIncident.referenceId
              ) {
                return {
                  ...incident,

                  status:
                    'Resolution Submitted',

                  staffResponse:
                    responseText.trim(),

                  resolutionResponse:
                    responseText.trim(),

                  resolutionSubmittedBy:
                    currentUser?.name ||
                    'Staff',

                  resolutionSubmittedAt:
                    now,

                  resolutionPendingAdmin:
                    true,
                };
              }

              return incident;
            }
          );

        /* ===================================================
           SAVE UPDATED INCIDENT
        =================================================== */

        localStorage.setItem(
          'sentraIncidents',
          JSON.stringify(
            updatedIncidents
          )
        );

        /* ===================================================
           CREATE ADMIN SIGNAL
        =================================================== */

        const storedSignals =
          localStorage.getItem(
            'sentraAdminResolutionSignals'
          );

        const adminSignals =
          storedSignals
            ? JSON.parse(
                storedSignals
              )
            : [];

        const newSignal = {
          id:
            `RES-${Date.now()}`,

          incidentId:
            selectedIncident.id,

          referenceId:
            selectedIncident.referenceId ||
            selectedIncident.id,

          department:
            selectedIncident.assignedDepartment ||
            selectedIncident.department ||
            selectedDepartment,

          staffName:
            currentUser?.name ||
            'Staff',

          message:
            `Resolution submitted for ${
              selectedIncident.referenceId ||
              selectedIncident.id
            }`,

          response:
            responseText.trim(),

          status:
            'Pending Admin Review',

          createdAt: now,

          read: false,
        };

        adminSignals.push(
          newSignal
        );

        localStorage.setItem(
          'sentraAdminResolutionSignals',
          JSON.stringify(
            adminSignals
          )
        );

        /* ===================================================
           UPDATE SELECTED INCIDENT
        =================================================== */

        const updatedSelectedIncident =
          {
            ...selectedIncident,

            status:
              'Resolution Submitted',

            staffResponse:
              responseText.trim(),

            resolutionResponse:
              responseText.trim(),

            resolutionSubmittedBy:
              currentUser?.name ||
              'Staff',

            resolutionSubmittedAt:
              now,

            resolutionPendingAdmin:
              true,
          };

        setSelectedIncident(
          updatedSelectedIncident
        );

        setDepartmentIncidents(
          updatedIncidents.filter(
            (incident) => {
              const department =
                currentUser?.department ||
                selectedDepartment;

              return (
                incident.assignedDepartment ===
                  department ||
                incident.department ===
                  department
              );
            }
          )
        );

        setResponseText('');

        alert(
          'Resolution submitted to Admin successfully.'
        );
      } catch (err) {
        console.error(
          'Failed to submit resolution:',
          err
        );

        alert(
          'Unable to submit resolution.'
        );
      } finally {
        setResolutionSubmitting(
          false
        );
      }
    };

  /* =========================================================
     FILTER DEPARTMENT REPORTS
  ========================================================= */

  const filteredDepartmentIncidents =
    departmentIncidents.filter(
      (incident) => {
        const search =
          incidentSearch
            .toLowerCase()
            .trim();

        const reference =
          String(
            incident.referenceId ||
              incident.id ||
              ''
          ).toLowerCase();

        const category =
          String(
            incident.category ||
              ''
          ).toLowerCase();

        const location =
          String(
            incident.location ||
              ''
          ).toLowerCase();

        const matchesSearch =
          !search ||
          reference.includes(
            search
          ) ||
          category.includes(
            search
          ) ||
          location.includes(
            search
          );

        const matchesStatus =
          statusFilter ===
            'All Statuses' ||
          incident.status ===
            statusFilter;

        const matchesPriority =
          priorityFilter ===
            'All Priorities' ||
          incident.priority ===
            priorityFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority
        );
      }
    );

  /* =========================================================
     DEPARTMENT REPORT COUNTS
  ========================================================= */

  const assignedCount =
    departmentIncidents.length;

  const inProgressCount =
    departmentIncidents.filter(
      (incident) =>
        incident.status ===
        'In Progress'
    ).length;

  const resolutionSubmittedCount =
    departmentIncidents.filter(
      (incident) =>
        incident.status ===
        'Resolution Submitted'
    ).length;

  const resolvedCount =
    departmentIncidents.filter(
      (incident) =>
        incident.status ===
        'Resolved'
    ).length;

  const filteredByDate = getFilteredByDate(filteredDepartmentIncidents);

  /* =========================================================
     DEPARTMENT REPORT PAGE
  ========================================================= */

  const renderDepartmentReports =
    () => {
      return (
        <div className="department-reports-page">

          {/* ===============================================
              PAGE HEADER
          =============================================== */}

          <div
            className="section-header"
            style={{
              marginBottom:
                '20px',
            }}
          >
            <div>

              <button
                className="btn btn-ghost btn-sm"
                onClick={
                  handleBackToDashboard
                }
                style={{
                  marginBottom:
                    '10px',
                }}
              >
                <ArrowLeft
                  size={16}
                />

                Back to Dashboard
              </button>

              <h1>
                Department Reports
              </h1>

              <p>
                View and manage incidents
                assigned to your department.
              </p>

            </div>
          </div>

          {/* ===============================================
              DEPARTMENT INFORMATION
          =============================================== */}

          <section
            className="urgent-section"
            style={{
              marginBottom:
                '20px',
            }}
          >

            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'center',
                gap: '15px',
              }}
            >

              <div className="card-icon">
                <Users
                  size={24}
                />
              </div>

              <div>

                <h2>
                  {currentUser?.department ||
                    selectedDepartment}
                </h2>

                <p>
                  Handle assigned incidents
                  and submit your response
                  to Admin.
                </p>

              </div>

            </div>

          </section>

          {/* ===============================================
              SUMMARY CARDS
          =============================================== */}

          <section className="summary-cards">

            <div className="summary-card">

              <div className="card-icon">
                <FileText
                  size={24}
                />
              </div>

              <div className="card-content">

                <h3>
                  {assignedCount}
                </h3>

                <p>
                  Assigned to Me
                </p>

              </div>

            </div>

            <div className="summary-card">

              <div className="card-icon">
                <Clock
                  size={24}
                />
              </div>

              <div className="card-content">

                <h3>
                  {inProgressCount}
                </h3>

                <p>
                  In Progress
                </p>

              </div>

            </div>

            <div className="summary-card">

              <div className="card-icon">
                <Send
                  size={24}
                />
              </div>

              <div className="card-content">

                <h3>
                  {
                    resolutionSubmittedCount
                  }
                </h3>

                <p>
                  Resolution Submitted
                </p>

              </div>

            </div>

            <div className="summary-card">

              <div className="card-icon">
                <CheckCircle
                  size={24}
                />
              </div>

              <div className="card-content">

                <h3>
                  {resolvedCount}
                </h3>

                <p>
                  Resolved
                </p>

              </div>

            </div>

          </section>

          {/* ===============================================
              DEPARTMENT PERFORMANCE METRICS
          =============================================== */}

          <section
            className="urgent-section"
            style={{
              marginBottom:
                '20px',
            }}
          >

            <div className="section-header">

              <h2>
                Department Performance
              </h2>

              <span className="item-count">
                This Month
              </span>

            </div>

            <div
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >

              <div
                style={{
                  padding:
                    '16px',
                  background:
                    'var(--color-surface)',
                  borderRadius:
                    '8px',
                  border:
                    '1px solid var(--color-border)',
                }}
              >

                <div
                  style={{
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '8px',
                    marginBottom:
                      '8px',
                  }}
                >

                  <TrendingUp
                    size={16}
                    style={{
                      color:
                        'var(--color-success)',
                    }}
                  />

                  <span
                    style={{
                      fontSize:
                        '12px',
                      color:
                        'var(--color-text-secondary)',
                    }}
                  >

                    Resolution Rate

                  </span>

                </div>

                <div
                  style={{
                    fontSize:
                      '24px',
                    fontWeight:
                      '600',
                  }}
                >

                  {resolvedCount > 0
                    ? Math.round(
                        (resolvedCount /
                          assignedCount) *
                          100
                      )
                    : 0}
                  %

                </div>

              </div>

              <div
                style={{
                  padding:
                    '16px',
                  background:
                    'var(--color-surface)',
                  borderRadius:
                    '8px',
                  border:
                    '1px solid var(--color-border)',
                }}
              >

                <div
                  style={{
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '8px',
                    marginBottom:
                      '8px',
                  }}
                >

                  <Clock
                    size={16}
                    style={{
                      color:
                        'var(--color-warning)',
                    }}
                  />

                  <span
                    style={{
                      fontSize:
                        '12px',
                      color:
                        'var(--color-text-secondary)',
                    }}
                  >

                    Avg. Resolution Time

                  </span>

                </div>

                <div
                  style={{
                    fontSize:
                      '24px',
                    fontWeight:
                      '600',
                  }}
                >

                  2.3
                  <span
                    style={{
                      fontSize:
                        '14px',
                      fontWeight:
                        '400',
                      marginLeft:
                        '4px',
                    }}
                  >

                    days

                  </span>

                </div>

              </div>

              <div
                style={{
                  padding:
                    '16px',
                  background:
                    'var(--color-surface)',
                  borderRadius:
                    '8px',
                  border:
                    '1px solid var(--color-border)',
                }}
              >

                <div
                  style={{
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '8px',
                    marginBottom:
                      '8px',
                  }}
                >

                  <AlertTriangle
                    size={16}
                    style={{
                      color:
                        'var(--color-error)',
                    }}
                  />

                  <span
                    style={{
                      fontSize:
                        '12px',
                      color:
                        'var(--color-text-secondary)',
                    }}
                  >

                    Critical Incidents

                  </span>

                </div>

                <div
                  style={{
                    fontSize:
                      '24px',
                    fontWeight:
                      '600',
                  }}
                >

                  {
                    departmentIncidents.filter(
                      (incident) =>
                        incident.priority ===
                          'Critical'
                    ).length
                  }

                </div>

              </div>

              <div
                style={{
                  padding:
                    '16px',
                  background:
                    'var(--color-surface)',
                  borderRadius:
                    '8px',
                  border:
                    '1px solid var(--color-border)',
                }}
              >

                <div
                  style={{
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '8px',
                    marginBottom:
                      '8px',
                  }}
                >

                  <CheckCircle
                    size={16}
                    style={{
                      color:
                        'var(--color-success)',
                    }}
                  />

                  <span
                    style={{
                      fontSize:
                      '12px',
                      color:
                        'var(--color-text-secondary)',
                    }}
                  >

                    Staff Response Rate

                  </span>

                </div>

                <div
                  style={{
                    fontSize:
                      '24px',
                    fontWeight:
                      '600',
                  }}
                >

                  {Math.round(
                    ((inProgressCount +
                      resolutionSubmittedCount +
                      resolvedCount) /
                      assignedCount) *
                      100
                  ) || 0}
                  %

                </div>

              </div>

            </div>

          </section>

          {/* ===============================================
              DEPARTMENT ACTIVITY LOG
          =============================================== */}

          <section
            className="urgent-section"
            style={{
              marginBottom:
                '20px',
            }}
          >

            <div className="section-header">

              <h2>
                Recent Department Activity
              </h2>

              <button className="btn btn-ghost btn-sm">
                View All Activity
              </button>

            </div>

            <div
              style={{
                display:
                  'flex',
                flexDirection:
                  'column',
                gap: '12px',
              }}
            >

              {departmentIncidents
                .filter(
                  (incident) =>
                    incident.staffResponse ||
                    incident.status ===
                      'Resolution Submitted' ||
                    incident.status ===
                      'Resolved'
                )
                .slice(0, 5)
                .map(
                  (incident) => (
                    <div
                      key={
                        incident.id ||
                        incident.referenceId
                      }
                      style={{
                        padding:
                          '12px',
                        background:
                          'var(--color-surface)',
                        borderRadius:
                          '8px',
                        border:
                          '1px solid var(--color-border)',
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '12px',
                      }}
                    >

                      <div
                        style={{
                          width:
                            '40px',
                          height:
                            '40px',
                          borderRadius:
                            '50%',
                          background:
                            'var(--color-primary)',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          color:
                            'white',
                        }}
                      >

                        {incident.status ===
                          'Resolved' ? (
                          <CheckCircle
                            size={20}
                          />
                        ) : (
                          <Send
                            size={20}
                          />
                        )}

                      </div>

                      <div
                        style={{
                          flex: 1,
                        }}
                      >

                        <div
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: '8px',
                            marginBottom:
                              '4px',
                          }}
                        >

                          <strong>
                            {
                              incident.referenceId ||
                              incident.id
                            }
                          </strong>

                          {getStatusBadge(
                            incident.status
                          )}

                        </div>

                        <p
                          style={{
                            fontSize:
                              '14px',
                            color:
                              'var(--color-text-secondary)',
                            marginBottom:
                              '4px',
                          }}
                        >

                          {incident.status ===
                            'Resolved'
                            ? 'Resolved by Admin'
                            : 'Resolution submitted by Staff'}

                        </p>

                        <span
                          style={{
                            fontSize:
                              '12px',
                            color:
                              'var(--color-text-tertiary)',
                          }}
                        >

                          {incident.resolutionSubmittedAt ||
                          incident.updatedAt
                            ? new Date(
                                incident.resolutionSubmittedAt ||
                                  incident.updatedAt
                              ).toLocaleDateString()
                            : 'Recently'}

                        </span>

                      </div>

                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          handleOpenDepartmentIncident(
                            incident
                          )
                        }
                      >

                        View

                      </button>

                    </div>
                  )
                )}

              {departmentIncidents.filter(
                (incident) =>
                  incident.staffResponse ||
                  incident.status ===
                    'Resolution Submitted' ||
                  incident.status ===
                    'Resolved'
              ).length === 0 && (
                <p className="empty-state-text">
                  No recent department activity
                </p>
              )}

            </div>

          </section>

          {/* ===============================================
              SEARCH + FILTER
          =============================================== */}

          <section
            className="urgent-section"
            style={{
              marginTop:
                '20px',
            }}
          >

            <div
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  '2fr 1fr 1fr auto',
                gap: '12px',
                alignItems:
                  'center',
              }}
            >

              {/* SEARCH */}

              <div
                style={{
                  position:
                    'relative',
                }}
              >

                <Search
                  size={18}
                  style={{
                    position:
                      'absolute',
                    left: '12px',
                    top: '50%',
                    transform:
                      'translateY(-50%)',
                  }}
                />

                <input
                  type="text"
                  className="input"
                  placeholder="Search by Reference ID, category or location..."
                  value={
                    incidentSearch
                  }
                  onChange={(e) =>
                    setIncidentSearch(
                      e.target.value
                    )
                  }
                  style={{
                    paddingLeft:
                      '40px',
                    width:
                      '100%',
                  }}
                />

              </div>

              {/* STATUS */}

              <select
                className="select"
                value={
                  statusFilter
                }
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
              >

                <option>
                  All Statuses
                </option>

                <option>
                  Assigned
                </option>

                <option>
                  Pending
                </option>

                <option>
                  In Progress
                </option>

                <option>
                  Resolution Submitted
                </option>

                <option>
                  Resolved
                </option>

              </select>

              {/* PRIORITY */}

              <select
                className="select"
                value={
                  priorityFilter
                }
                onChange={(e) =>
                  setPriorityFilter(
                    e.target.value
                  )
                }
              >

                <option>
                  All Priorities
                </option>

                <option>
                  Critical
                </option>

                <option>
                  High
                </option>

                <option>
                  Medium
                </option>

                <option>
                  Low
                </option>

              </select>

              {/* RESET */}

              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIncidentSearch(
                    ''
                  );

                  setStatusFilter(
                    'All Statuses'
                  );

                  setPriorityFilter(
                    'All Priorities'
                  );
                  setDateRange({
                    startDate: '',
                    endDate: ''
                  });
                }}
              >
                <Filter
                  size={16}
                />

                Reset
              </button>

            </div>

            {/* DATE RANGE FILTER */}

            <div
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  '1fr 1fr auto',
                gap: '12px',
                alignItems:
                  'center',
                marginTop:
                  '12px',
              }}
            >

              <input
                type="date"
                className="input"
                placeholder="Start Date"
                value={
                  dateRange.startDate
                }
                onChange={(e) =>
                  setDateRange(
                    prev => ({
                      ...prev,
                      startDate:
                        e.target.value
                    })
                  )
                }
              />

              <input
                type="date"
                className="input"
                placeholder="End Date"
                value={
                  dateRange.endDate
                }
                onChange={(e) =>
                  setDateRange(
                    prev => ({
                      ...prev,
                      endDate:
                        e.target.value
                    })
                  )
                }
              />

              {/* EXPORT BUTTON */}

              <div
                style={{
                  position:
                    'relative',
                }}
              >

                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    setShowExportOptions(
                      !showExportOptions
                    )
                  }
                >
                  <Download
                    size={16}
                  />

                  Export
                </button>

                {showExportOptions && (
                  <div
                    style={{
                      position:
                        'absolute',
                      top:
                        '100%',
                      right:
                        '0',
                      zIndex:
                        1000,
                      background:
                        'white',
                      border:
                        '1px solid #e5e7eb',
                      borderRadius:
                        '8px',
                      boxShadow:
                        '0 4px 6px rgba(0, 0, 0, 0.1)',
                      minWidth:
                        '150px',
                      marginTop:
                        '8px',
                    }}
                  >

                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={
                        handleExportCSV
                      }
                      style={{
                        width:
                          '100%',
                        textAlign:
                          'left',
                        justifyContent:
                          'flex-start',
                      }}
                    >

                      Export as CSV

                    </button>

                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={
                        handleExportJSON
                      }
                      style={{
                        width:
                          '100%',
                        textAlign:
                          'left',
                        justifyContent:
                          'flex-start',
                      }}
                    >

                      Export as JSON

                    </button>

                  </div>
                )}

              </div>

            </div>

            {/* BULK ACTIONS */}

            {selectedIncidents.length > 0 && (
              <div
                style={{
                  marginTop:
                    '12px',
                  padding:
                    '12px',
                  background:
                    'rgba(59, 130, 246, 0.08)',
                  border:
                    '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius:
                    '8px',
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap: '12px',
                }}
              >

                <span>
                  {selectedIncidents.length}{' '}
                  incidents selected
                </span>

                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() =>
                    handleBulkStatusUpdate(
                      'In Progress'
                    )
                  }
                >

                  Mark In Progress

                </button>

                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() =>
                    handleBulkStatusUpdate(
                      'Resolution Submitted'
                    )
                  }
                >

                  Submit Resolution

                </button>

                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() =>
                    setSelectedIncidents(
                      []
                    )
                  }
                >

                  Clear Selection

                </button>

              </div>
            )}

          </section>

          {/* ===============================================
              TABLE + DETAILS
          =============================================== */}

          <div
            className="content-grid"
            style={{
              marginTop:
                '20px',
              gridTemplateColumns:
                selectedIncident
                  ? '1.6fr 1fr'
                  : '1fr',
            }}
          >

            {/* =============================================
                INCIDENT TABLE
            ============================================= */}

            <section className="activity-section">

              <div className="section-header">

                <div>

                  <h2>
                    Assigned Incidents
                  </h2>

                  <span className="item-count">
                    {
                      filteredByDate.length
                    }{' '}
                    incidents
                  </span>

                </div>

              </div>

              <div className="activity-table-container">

                <table className="table activity-table">

                  <thead>

                    <tr>

                      <th>
                        <input
                          type="checkbox"
                          checked={
                            selectedIncidents.length ===
                              filteredByDate.length &&
                            filteredByDate.length > 0
                          }
                          onChange={
                            handleSelectAll
                          }
                        />
                      </th>

                      <th>
                        Reference ID
                      </th>

                      <th>
                        Category
                      </th>

                      <th>
                        Location
                      </th>

                      <th>
                        Date
                      </th>

                      <th>
                        Priority
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredByDate.length ===
                    0 ? (

                      <tr>

                        <td
                          colSpan={8}
                          className="empty-state-text"
                        >
                          No incidents are assigned
                          to your department.
                        </td>

                      </tr>

                    ) : (

                      filteredByDate.map(
                        (incident) => (

                          <tr
                            key={
                              incident.id ||
                              incident.referenceId
                            }
                          >

                            <td>
                              <input
                                type="checkbox"
                                checked={selectedIncidents.includes(
                                  incident.id ||
                                  incident.referenceId
                                )}
                                onChange={() =>
                                  handleSelectIncident(
                                    incident.id ||
                                    incident.referenceId
                                  )
                                }
                              />
                            </td>

                            <td>
                              <strong>
                                {
                                  incident.referenceId ||
                                  incident.id
                                }
                              </strong>
                            </td>

                            <td>
                              {
                                incident.category ||
                                '—'
                              }
                            </td>

                            <td>
                              {
                                incident.location ||
                                '—'
                              }
                            </td>

                            <td>

                              {incident.date ||
                              incident.createdAt
                                ? new Date(
                                    incident.date ||
                                      incident.createdAt
                                  ).toLocaleDateString()
                                : '—'}

                            </td>

                            <td>

                              {getPriorityBadge(
                                incident.priority ||
                                  'Medium'
                              )}

                            </td>

                            <td>

                              {getStatusBadge(
                                incident.status ||
                                  'Assigned'
                              )}

                            </td>

                            <td>

                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() =>
                                  handleOpenDepartmentIncident(
                                    incident
                                  )
                                }
                              >

                                <Eye
                                  size={15}
                                />

                                View

                              </button>

                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </section>

            {/* =============================================
                INCIDENT DETAILS
            ============================================= */}

            {selectedIncident && (

              <section className="activity-section">

                <div className="section-header">

                  <div>

                    <h2>
                      {
                        selectedIncident.referenceId ||
                        selectedIncident.id
                      }
                    </h2>

                    <p>
                      {
                        selectedIncident.category ||
                        'Incident'
                      }
                    </p>

                  </div>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      setSelectedIncident(
                        null
                      )
                    }
                  >
                    <X
                      size={16}
                    />
                  </button>

                </div>

                <div
                  style={{
                    display:
                      'flex',
                    flexDirection:
                      'column',
                    gap: '15px',
                  }}
                >

                  {/* STATUS */}

                  <div>

                    <strong>
                      Status
                    </strong>

                    <div
                      style={{
                        marginTop:
                          '5px',
                      }}
                    >
                      {getStatusBadge(
                        selectedIncident.status ||
                          'Assigned'
                      )}
                    </div>

                  </div>

                  {/* PRIORITY */}

                  <div>

                    <strong>
                      Priority
                    </strong>

                    <div
                      style={{
                        marginTop:
                          '5px',
                      }}
                    >
                      {getPriorityBadge(
                        selectedIncident.priority ||
                          'Medium'
                      )}
                    </div>

                  </div>

                  {/* LOCATION */}

                  <div>

                    <strong>

                      <MapPin
                        size={15}
                        style={{
                          verticalAlign:
                            'middle',
                        }}
                      />

                      {' '}Location

                    </strong>

                    <p>
                      {
                        selectedIncident.location ||
                        'Not provided'
                      }
                    </p>

                  </div>

                  {/* DATE */}

                  <div>

                    <strong>

                      <Calendar
                        size={15}
                        style={{
                          verticalAlign:
                            'middle',
                        }}
                      />

                      {' '}Date

                    </strong>

                    <p>

                      {selectedIncident.date ||
                      selectedIncident.createdAt
                        ? new Date(
                            selectedIncident.date ||
                              selectedIncident.createdAt
                          ).toLocaleDateString()
                        : 'Not provided'}

                    </p>

                  </div>

                  {/* DESCRIPTION */}

                  <div>

                    <strong>
                      Description
                    </strong>

                    <p
                      style={{
                        lineHeight:
                          '1.6',
                      }}
                    >
                      {
                        selectedIncident.description ||
                        'No description provided.'
                      }
                    </p>

                  </div>

                  {/* ASSIGNED BY */}

                  <div>

                    <strong>
                      Assigned By
                    </strong>

                    <p>
                      {
                        selectedIncident.assignedBy ||
                        selectedIncident.assignedByName ||
                        'Administrator'
                      }
                    </p>

                  </div>

                  {/* DEPARTMENT */}

                  <div>

                    <strong>
                      Assigned Department
                    </strong>

                    <p>
                      {
                        selectedIncident.assignedDepartment ||
                        selectedIncident.department ||
                        selectedDepartment
                      }
                    </p>

                  </div>

                  {/* =======================================
                      STAFF ACTION / RESPONSE
                  ======================================= */}

                  <div>

                    <strong>
                      Your Action / Response
                    </strong>

                    <textarea
                      className="input"
                      placeholder="Describe the action you have taken..."
                      value={
                        responseText
                      }
                      onChange={(e) =>
                        setResponseText(
                          e.target.value
                        )
                      }
                      disabled={
                        selectedIncident.status ===
                          'Resolution Submitted' ||
                        selectedIncident.status ===
                          'Resolved'
                      }
                      style={{
                        width:
                          '100%',
                        minHeight:
                          '130px',
                        marginTop:
                          '8px',
                        resize:
                          'vertical',
                      }}
                    />

                  </div>

                  {/* =======================================
                      SUBMITTED RESPONSE
                  ======================================= */}

                  {selectedIncident.staffResponse && (

                    <div
                      style={{
                        padding:
                          '12px',
                        borderRadius:
                          '8px',
                        background:
                          'var(--color-surface)',
                      }}
                    >

                      <strong>
                        Submitted Response
                      </strong>

                      <p>
                        {
                          selectedIncident.staffResponse
                        }
                      </p>

                      {selectedIncident.resolutionSubmittedBy && (

                        <small>
                          Submitted by:{' '}
                          {
                            selectedIncident.resolutionSubmittedBy
                          }
                        </small>

                      )}

                    </div>

                  )}

                  {/* =======================================
                      SUBMIT RESOLUTION
                  ======================================= */}

                  {selectedIncident.status !==
                    'Resolved' &&
                    selectedIncident.status !==
                      'Resolution Submitted' && (

                    <button
                      className="btn btn-primary"
                      onClick={
                        handleSubmitResolution
                      }
                      disabled={
                        resolutionSubmitting
                      }
                      style={{
                        width:
                          '100%',
                        justifyContent:
                          'center',
                      }}
                    >

                      <Send
                        size={17}
                      />

                      {resolutionSubmitting
                        ? 'Submitting...'
                        : 'Submit Resolution to Admin'}

                    </button>

                  )}

                  {/* =======================================
                      WAITING FOR ADMIN
                  ======================================= */}

                  {selectedIncident.status ===
                    'Resolution Submitted' && (

                    <div
                      style={{
                        padding:
                          '15px',
                        borderRadius:
                          '8px',
                        background:
                          'rgba(59, 130, 246, 0.08)',
                        border:
                          '1px solid rgba(59, 130, 246, 0.2)',
                      }}
                    >

                      <strong>
                        Resolution Submitted
                      </strong>

                      <p>
                        Your resolution has
                        been sent to Admin.
                        Admin must review
                        it before marking
                        the incident as
                        Resolved.
                      </p>

                    </div>

                  )}

                  {/* =======================================
                      RESOLVED
                  ======================================= */}

                  {selectedIncident.status ===
                    'Resolved' && (

                    <div
                      style={{
                        padding:
                          '15px',
                        borderRadius:
                          '8px',
                        background:
                          'rgba(34, 197, 94, 0.08)',
                        border:
                          '1px solid rgba(34, 197, 94, 0.2)',
                      }}
                    >

                      <strong>

                        <CheckCircle
                          size={17}
                          style={{
                            verticalAlign:
                              'middle',
                          }}
                        />

                        {' '}Resolved

                      </strong>

                      <p>
                        Admin has reviewed
                        your response and
                        marked this incident
                        as resolved.
                      </p>

                    </div>

                  )}

                </div>

              </section>

            )}

          </div>

        </div>
      );
    };

  /* =========================================================
     MAIN RETURN
  ========================================================= */

  return (
    <div className="staff-dashboard-container">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`staff-sidebar ${
          showMobileMenu
            ? 'show'
            : ''
        }`}
      >

        <div className="sidebar-header">

          <div className="sidebar-logo">

            <Shield
              size={28}
            />

            <span>
              Sentra
            </span>

          </div>

          <button
            className="mobile-close-btn"
            onClick={() =>
              setShowMobileMenu(
                false
              )
            }
          >
            <X
              size={24}
            />
          </button>

        </div>

        <nav className="sidebar-nav">

          {/* DEPARTMENT */}

          <div className="department-selector">

            <label className="label">
              Department
            </label>

            <select
              className="select"
              value={
                selectedDepartment
              }
              onChange={(e) =>
                setSelectedDepartment(
                  e.target.value
                )
              }
            >

              {departments.map(
                (dept) => (

                  <option
                    key={dept}
                    value={dept}
                  >
                    {dept}
                  </option>

                )
              )}

            </select>

          </div>

          <div className="nav-section">

            {/* DASHBOARD */}

            <button
              className={`nav-item ${
                !showDepartmentReports
                  ? 'active'
                  : ''
              }`}
              onClick={
                handleBackToDashboard
              }
            >

              <FileText
                size={18}
              />

              Dashboard

            </button>

            {/* DEPARTMENT REPORTS */}

            <button
              className={`nav-item ${
                showDepartmentReports
                  ? 'active'
                  : ''
              }`}
              onClick={
                handleDepartmentReports
              }
            >

              <FileText
                size={18}
              />

              Department Reports

            </button>

            {/* REPORT INCIDENT */}

            <button
              className="nav-item"
              onClick={
                handleReportIncident
              }
            >

              <Plus
                size={18}
              />

              Report Incident

            </button>

            {/* TRACK REPORT */}

            <button
              className="nav-item"
              onClick={() => navigate('/track-report')}
            >

              <Search
                size={18}
              />

              Track Report

            </button>

          </div>

        </nav>

        {/* SIDEBAR FOOTER */}

        <div className="sidebar-footer">

          <div className="user-profile">

            <div className="user-avatar">

              <User
                size={20}
              />

            </div>

            <div className="user-info">

              <span className="user-name">

                {currentUser?.name ||
                  'Loading...'}

              </span>

              <span className="user-role">

                {currentUser?.role ||
                  'Staff'}

              </span>

            </div>

          </div>

          <button
            className="sign-out-btn"
            onClick={
              handleLogout
            }
          >

            <LogOut
              size={18}
            />

            Sign out

          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="staff-main">

        {/* HEADER */}

        <header className="staff-header">

          <button
            className="mobile-menu-btn"
            onClick={() =>
              setShowMobileMenu(
                !showMobileMenu
              )
            }
          >

            {showMobileMenu ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}

          </button>

          <div className="header-content">

            <h1>

              {showDepartmentReports
                ? 'Department Reports'
                : 'Department Safety Center'}

            </h1>

            <p>

              {showDepartmentReports
                ? 'Manage incidents assigned to your department'
                : 'Manage and respond to safety incidents in your area'}

            </p>

          </div>

          <div className="header-actions">

            <button
              className="btn btn-primary"
              onClick={
                handleReportIncident
              }
            >

              <Plus
                size={18}
              />

              Report Incident

            </button>

            {/* NOTIFICATIONS */}

            <div className="notification-wrapper">

              <button
                className="notification-btn"
                onClick={() =>
                  setShowNotifications(
                    !showNotifications
                  )
                }
              >

                <Bell
                  size={20}
                />

                {unreadCount >
                  0 && (

                  <span className="notification-badge">
                    {unreadCount}
                  </span>

                )}

              </button>

              {showNotifications && (

                <div className="notification-dropdown">

                  <div className="notification-header">

                    <h4>
                      Notifications
                    </h4>

                    <button
                      className="mark-read-btn"
                      onClick={
                        handleMarkAllRead
                      }
                    >
                      Mark all as read
                    </button>

                  </div>

                  <div className="notification-list">

                    {notifications.length ===
                    0 ? (

                      <p className="empty-state-text">
                        No notifications
                      </p>

                    ) : (

                      notifications.map(
                        (
                          notification
                        ) => (

                          <div
                            key={
                              notification.id
                            }
                            className={`notification-item ${
                              !notification.read
                                ? 'unread'
                                : ''
                            }`}
                          >

                            <p>
                              {
                                notification.message
                              }
                            </p>

                            <span className="notification-time">
                              {
                                notification.time ||
                                ''
                              }
                            </span>

                          </div>

                        )
                      )

                    )}

                  </div>

                </div>

              )}

            </div>

          </div>

        </header>

        {/* ===================================================
            DASHBOARD CONTENT
        =================================================== */}

        <div className="dashboard-content">

          {/* =================================================
              DEPARTMENT REPORTS
          ================================================= */}

          {showDepartmentReports ? (

            renderDepartmentReports()

          ) : (

            /* =================================================
               ORIGINAL DASHBOARD
            ================================================= */

            <>

              {error && (

                <div className="error-banner">

                  {error}

                </div>

              )}

              {/* =============================================
                  SUMMARY CARDS
              ============================================= */}

              <section className="summary-cards">

                {/* OPEN CASES */}

                <div className="summary-card summary-open">

                  <div className="card-icon">

                    <AlertTriangle
                      size={24}
                    />

                  </div>

                  <div className="card-content">

                    <h3>

                      {loading
                        ? '—'
                        : stats.openCases}

                    </h3>

                    <p>
                      Open Cases
                    </p>

                    <span className="card-subtitle">
                      in your dept.
                    </span>

                  </div>

                </div>

                {/* NEEDS ATTENTION */}

                <div className="summary-card summary-attention">

                  <div className="card-icon">

                    <AlertTriangle
                      size={24}
                    />

                  </div>

                  <div className="card-content">

                    <h3>

                      {loading
                        ? '—'
                        : stats.needsAttention}

                    </h3>

                    <p>
                      Needs Attention
                    </p>

                    <span className="card-subtitle">
                      (high/critical)
                    </span>

                  </div>

                </div>

                {/* PENDING */}

                <div className="summary-card summary-pending">

                  <div className="card-icon">

                    <Clock
                      size={24}
                    />

                  </div>

                  <div className="card-content">

                    <h3>

                      {loading
                        ? '—'
                        : stats.pendingReview}

                    </h3>

                    <p>
                      Pending Review
                    </p>

                    <span className="card-subtitle">
                      (awaiting action)
                    </span>

                  </div>

                </div>

                {/* RESOLVED */}

                <div className="summary-card summary-resolved">

                  <div className="card-icon">

                    <CheckCircle
                      size={24}
                    />

                  </div>

                  <div className="card-content">

                    <h3>

                      {loading
                        ? '—'
                        : stats.resolved}

                    </h3>

                    <p>
                      Resolved
                    </p>

                    <span className="card-subtitle">
                      (this month)
                    </span>

                  </div>

                </div>

              </section>

              {/* =============================================
                  URGENT ITEMS
              ============================================= */}

              <section className="urgent-section">

                <div className="section-header">

                  <h2>
                    Requires Your Attention
                  </h2>

                  <span className="item-count">

                    {urgentItems.length}{' '}
                    urgent items

                  </span>

                </div>

                {loading ? (

                  <p className="empty-state-text">
                    Loading...
                  </p>

                ) : urgentItems.length ===
                  0 ? (

                  <p className="empty-state-text">
                    Nothing urgent right now.
                  </p>

                ) : (

                  <div className="urgent-grid">

                    {urgentItems.map(
                      (item) => (

                        <div
                          key={item.id}
                          className="urgent-card"
                        >

                          <div className="urgent-header">

                            <div className="urgent-info">

                              <span className="urgent-category">
                                {
                                  item.category
                                }
                              </span>

                              <span className="urgent-id">
                                {
                                  item.referenceId ||
                                  item.id
                                }
                              </span>

                            </div>

                            <div className="urgent-badges">

                              {getPriorityBadge(
                                item.priority
                              )}

                              {getStatusBadge(
                                item.status
                              )}

                            </div>

                          </div>

                          <div className="urgent-body">

                            <div className="urgent-location">

                              <Shield
                                size={14}
                              />

                              {
                                item.location ||
                                'Location not provided'
                              }

                            </div>

                            <span className="urgent-time">

                              {
                                item.time ||
                                item.date ||
                                ''
                              }

                            </span>

                          </div>

                          <button
                            className="urgent-action"
                            onClick={() =>
                              handleViewIncident(
                                item.id
                              )
                            }
                          >

                            View Details

                            <ChevronRight
                              size={16}
                            />

                          </button>

                        </div>

                      )
                    )}

                  </div>

                )}

              </section>

              {/* =============================================
                  CONTENT GRID
              ============================================= */}

              <div className="content-grid">

                {/* PENDING ACTIONS */}

                <section className="pending-section">

                  <div className="section-header">

                    <h2>
                      Pending Actions
                    </h2>

                    <button className="btn btn-ghost btn-sm">
                      View All
                    </button>

                  </div>

                  <div className="pending-list">

                    {loading ? (

                      <p className="empty-state-text">
                        Loading...
                      </p>

                    ) : pendingActions.length ===
                      0 ? (

                      <p className="empty-state-text">
                        No pending actions.
                      </p>

                    ) : (

                      pendingActions.map(
                        (action, index) => (

                          <div
                            key={index}
                            className="pending-item"
                          >

                            <div className="pending-indicator" />

                            <div className="pending-content">

                              <p>

                                {
                                  action.action
                                }{' '}

                                {action.reference && (

                                  <strong>
                                    {
                                      action.reference
                                    }
                                  </strong>

                                )}

                              </p>

                              <span className="pending-time">
                                {
                                  action.time
                                }
                              </span>

                            </div>

                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={
                                handleDepartmentReports
                              }
                            >
                              Complete
                            </button>

                          </div>

                        )
                      )

                    )}

                  </div>

                </section>

                {/* RECENT ACTIVITY */}

                <section className="activity-section">

                  <div className="section-header">

                    <h2>
                      Recent Department Activity
                    </h2>

                    <button className="btn btn-ghost btn-sm">
                      View All
                    </button>

                  </div>

                  <div className="activity-table-container">

                    <table className="table activity-table">

                      <thead>

                        <tr>

                          <th>
                            Incident
                          </th>

                          <th>
                            Date
                          </th>

                          <th>
                            Status
                          </th>

                          <th>
                            Actions
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {loading ? (

                          <tr>

                            <td
                              colSpan={4}
                              className="empty-state-text"
                            >
                              Loading...
                            </td>

                          </tr>

                        ) : recentActivity.length ===
                          0 ? (

                          <tr>

                            <td
                              colSpan={4}
                              className="empty-state-text"
                            >
                              No recent activity.
                            </td>

                          </tr>

                        ) : (

                          recentActivity.map(
                            (activity) => (

                              <tr
                                key={
                                  activity.id
                                }
                              >

                                <td>
                                  {
                                    activity.incident
                                  }
                                </td>

                                <td>
                                  {
                                    activity.date
                                  }
                                </td>

                                <td>
                                  {getStatusBadge(
                                    activity.status
                                  )}
                                </td>

                                <td>

                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() =>
                                      handleViewIncident(
                                        activity.id
                                      )
                                    }
                                  >
                                    View
                                  </button>

                                </td>

                              </tr>

                            )
                          )

                        )}

                      </tbody>

                    </table>

                  </div>

                </section>

              </div>

              {/* =============================================
                  CATEGORY
              ============================================= */}

              <section className="category-section">

                <div className="section-header">

                  <h2>
                    Incidents by Category
                  </h2>

                  <button className="btn btn-ghost btn-sm">
                    View Report
                  </button>

                </div>

                {loading ? (

                  <p className="empty-state-text">
                    Loading...
                  </p>

                ) : incidentsByCategory.length ===
                  0 ? (

                  <p className="empty-state-text">
                    No category data yet.
                  </p>

                ) : (

                  <div className="category-grid">

                    {incidentsByCategory.map(
                      (item, index) => (

                        <div
                          key={index}
                          className="category-card"
                        >

                          <div className="category-info">

                            <h3>
                              {
                                item.category
                              }
                            </h3>

                            <span className="category-count">
                              {
                                item.count
                              }{' '}
                              incidents
                            </span>

                          </div>

                          {typeof item.trend ===
                            'number' && (

                            <div className="category-trend">

                              <TrendingUp
                                size={16}
                              />

                              <span>

                                {item.trend >
                                0
                                  ? '+'
                                  : ''}

                                {
                                  item.trend
                                }%

                              </span>

                            </div>

                          )}

                        </div>

                      )
                    )}

                  </div>

                )}

              </section>

            </>

          )}

        </div>

      </main>

    </div>
  );
}

export default StaffDashboard;