import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Users,
  UserCheck,
  LoaderCircle,
  FileCheck,
  CheckCircle,
  ClipboardList,
  MapPin,
  CalendarDays,
  User,
  Building2,
  Paperclip,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Send,
  X
} from 'lucide-react';

import '../styles/designSystem.css';
import '../styles/departmentReports.css';

function DepartmentReports() {
  const navigate = useNavigate();

  // =====================================================
  // USER
  // =====================================================

  const [currentUser, setCurrentUser] = useState(null);

  // =====================================================
  // INCIDENTS
  // =====================================================

  const [incidents, setIncidents] = useState([]);

  const [selectedIncident, setSelectedIncident] =
    useState(null);

  // =====================================================
  // FILTERS
  // =====================================================

  const [searchTerm, setSearchTerm] = useState('');

  const [departmentFilter, setDepartmentFilter] =
    useState('All Departments');

  const [statusFilter, setStatusFilter] =
    useState('All Statuses');

  const [priorityFilter, setPriorityFilter] =
    useState('All Priorities');

  // =====================================================
  // RESPONSE
  // =====================================================

  const [response, setResponse] = useState('');

  const [evidence, setEvidence] = useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  // =====================================================
  // PAGINATION
  // =====================================================

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  // =====================================================
  // LOAD USER + INCIDENTS
  // =====================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const storedUser =
        localStorage.getItem('user');

      if (storedUser) {
        const user = JSON.parse(storedUser);

        setCurrentUser(user);
      }

      /*
       * Frontend-only data source.
       *
       * Admin-assigned incidents should be stored
       * in localStorage under "incidents".
       */

      const storedIncidents =
        localStorage.getItem('incidents');

      if (storedIncidents) {
        const parsed =
          JSON.parse(storedIncidents);

        setIncidents(
          Array.isArray(parsed)
            ? parsed
            : []
        );
      } else {
        setIncidents([]);
      }
    } catch (error) {
      console.error(
        'Failed to load department reports:',
        error
      );

      setIncidents([]);
    }
  };

  // =====================================================
  // STAFF DEPARTMENT
  // =====================================================

  const staffDepartment =
    currentUser?.department ||
    currentUser?.assignedDepartment ||
    'IT Department';

  // =====================================================
  // FILTER INCIDENTS
  // =====================================================

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {

      // -----------------------------------------------
      // Only incidents assigned to a department/staff
      // -----------------------------------------------

      const incidentDepartment =
        incident.assignedDepartment ||
        incident.department ||
        '';

      const assignedStaff =
        incident.assignedStaff ||
        incident.assignedTo ||
        '';

      const staffName =
        currentUser?.name || '';

      const belongsToDepartment =
        incidentDepartment ===
        staffDepartment;

      const belongsToStaff =
        !assignedStaff ||
        assignedStaff === staffName ||
        assignedStaff === currentUser?._id ||
        assignedStaff === currentUser?.id;

      /*
       * We show reports assigned to this department.
       */

      if (
        !belongsToDepartment &&
        !belongsToStaff
      ) {
        return false;
      }

      // -----------------------------------------------
      // SEARCH
      // -----------------------------------------------

      const search =
        searchTerm.toLowerCase();

      const reference =
        String(
          incident.referenceId ||
          incident.id ||
          ''
        ).toLowerCase();

      const category =
        String(
          incident.category || ''
        ).toLowerCase();

      const title =
        String(
          incident.title ||
          incident.incident ||
          ''
        ).toLowerCase();

      const matchesSearch =
        !search ||
        reference.includes(search) ||
        category.includes(search) ||
        title.includes(search);

      // -----------------------------------------------
      // DEPARTMENT
      // -----------------------------------------------

      const matchesDepartment =
        departmentFilter ===
          'All Departments' ||
        incidentDepartment ===
          departmentFilter;

      // -----------------------------------------------
      // STATUS
      // -----------------------------------------------

      const status =
        incident.status || 'Assigned';

      const matchesStatus =
        statusFilter ===
          'All Statuses' ||
        status === statusFilter;

      // -----------------------------------------------
      // PRIORITY
      // -----------------------------------------------

      const priority =
        incident.priority || 'Medium';

      const matchesPriority =
        priorityFilter ===
          'All Priorities' ||
        priority === priorityFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    incidents,
    searchTerm,
    departmentFilter,
    statusFilter,
    priorityFilter,
    staffDepartment,
    currentUser
  ]);

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredIncidents.length /
          itemsPerPage
      )
    );

  const paginatedIncidents =
    filteredIncidents.slice(
      (currentPage - 1) *
        itemsPerPage,
      currentPage *
        itemsPerPage
    );

  // =====================================================
  // SUMMARY COUNTS
  // =====================================================

  const assignedToMe =
    incidents.filter((incident) => {

      const department =
        incident.assignedDepartment ||
        incident.department;

      const assignedStaff =
        incident.assignedStaff ||
        incident.assignedTo;

      return (
        department === staffDepartment ||
        assignedStaff === currentUser?.name ||
        assignedStaff === currentUser?._id ||
        assignedStaff === currentUser?.id
      );
    }).length;

  const inProgress =
    incidents.filter(
      (incident) =>
        incident.status ===
          'In Progress' &&
        (
          incident.assignedDepartment ===
            staffDepartment ||
          incident.department ===
            staffDepartment
        )
    ).length;

  const resolutionSubmitted =
    incidents.filter(
      (incident) =>
        (
          incident.status ===
            'Resolution Submitted' ||
          incident.status ===
            'Awaiting Admin Verification'
        ) &&
        (
          incident.assignedDepartment ===
            staffDepartment ||
          incident.department ===
            staffDepartment
        )
    ).length;

  const resolved =
    incidents.filter(
      (incident) =>
        incident.status ===
          'Resolved' &&
        (
          incident.assignedDepartment ===
            staffDepartment ||
          incident.department ===
            staffDepartment
        )
    ).length;

  const totalDepartment =
    incidents.filter(
      (incident) =>
        incident.assignedDepartment ===
          staffDepartment ||
        incident.department ===
          staffDepartment
    ).length;

  // =====================================================
  // VIEW INCIDENT
  // =====================================================

  const handleViewIncident = (
    incident
  ) => {
    setSelectedIncident(incident);

    setResponse(
      incident.staffResponse ||
      incident.resolutionMessage ||
      ''
    );

    setEvidence(null);
  };

  // =====================================================
  // START INCIDENT
  // =====================================================

  const handleStartIncident = () => {
    if (!selectedIncident) return;

    updateIncident({
      ...selectedIncident,
      status: 'In Progress'
    });
  };

  // =====================================================
  // UPDATE LOCAL STORAGE
  // =====================================================

  const updateIncident = (
    updatedIncident
  ) => {

    const updatedIncidents =
      incidents.map((incident) => {

        const incidentId =
          incident.id ||
          incident.referenceId;

        const updatedId =
          updatedIncident.id ||
          updatedIncident.referenceId;

        return incidentId === updatedId
          ? updatedIncident
          : incident;
      });

    setIncidents(
      updatedIncidents
    );

    localStorage.setItem(
      'incidents',
      JSON.stringify(
        updatedIncidents
      )
    );

    setSelectedIncident(
      updatedIncident
    );
  };

  // =====================================================
  // STAFF SUBMITS RESPONSE
  // =====================================================

  const handleSubmitUpdate = () => {

    if (!selectedIncident) {
      return;
    }

    if (!response.trim()) {
      alert(
        'Please describe the action taken.'
      );

      return;
    }

    setSubmitting(true);

    /*
     * Frontend-only simulation.
     *
     * IMPORTANT:
     * Staff does NOT directly mark the incident
     * as Resolved.
     *
     * It becomes:
     *
     * Resolution Submitted
     *
     * Admin can then verify it and mark it
     * as Resolved.
     */

    setTimeout(() => {

      const updatedIncident = {
        ...selectedIncident,

        status:
          'Resolution Submitted',

        staffResponse:
          response.trim(),

        resolutionMessage:
          response.trim(),

        resolutionSubmittedBy:
          currentUser?.name ||
          'Staff',

        resolutionSubmittedAt:
          new Date().toISOString(),

        evidence:
          evidence
            ? evidence.name
            : selectedIncident.evidence ||
              null
      };

      updateIncident(
        updatedIncident
      );

      /*
       * Create a frontend notification
       * for Admin.
       */

      createAdminNotification(
        updatedIncident
      );

      setSubmitting(false);

      alert(
        'Response submitted to Admin successfully.'
      );

    }, 500);
  };

  // =====================================================
  // ADMIN NOTIFICATION
  // =====================================================

  const createAdminNotification = (
    incident
  ) => {

    try {

      const stored =
        localStorage.getItem(
          'adminNotifications'
        );

      const notifications =
        stored
          ? JSON.parse(stored)
          : [];

      const notification = {
        id:
          Date.now().toString(),

        type:
          'resolution_submitted',

        message:
          `${currentUser?.name || 'Staff'} submitted a resolution for ${
            incident.referenceId ||
            incident.id
          }.`,

        incidentId:
          incident.id ||
          incident.referenceId,

        read: false,

        createdAt:
          new Date().toISOString()
      };

      localStorage.setItem(
        'adminNotifications',
        JSON.stringify([
          notification,
          ...notifications
        ])
      );

    } catch (error) {
      console.error(
        'Notification error:',
        error
      );
    }
  };

  // =====================================================
  // FILE UPLOAD
  // =====================================================

  const handleEvidenceUpload = (
    event
  ) => {

    const file =
      event.target.files?.[0];

    if (file) {
      setEvidence(file);
    }
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {

    setSearchTerm('');

    setDepartmentFilter(
      'All Departments'
    );

    setStatusFilter(
      'All Statuses'
    );

    setPriorityFilter(
      'All Priorities'
    );

    setCurrentPage(1);
  };

  // =====================================================
  // PAGE CHANGE
  // =====================================================

  const changePage = (
    page
  ) => {

    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  };

  // =====================================================
  // STATUS TIMELINE
  // =====================================================

  const getTimelineSteps = (
    incident
  ) => {

    const status =
      incident?.status;

    const statuses = [
      'Pending',
      'Assigned',
      'In Progress',
      'Resolution Submitted',
      'Resolved'
    ];

    let currentIndex =
      statuses.indexOf(status);

    if (
      status ===
      'Awaiting Admin Verification'
    ) {
      currentIndex = 3;
    }

    if (currentIndex < 0) {
      currentIndex = 1;
    }

    return statuses.map(
      (item, index) => ({
        label: item,
        completed:
          index <= currentIndex,
        active:
          index === currentIndex
      })
    );
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (
    date
  ) => {

    if (!date) {
      return '—';
    }

    return new Date(date).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      }
    );
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (
    date
  ) => {

    if (!date) {
      return '';
    }

    return new Date(date).toLocaleTimeString(
      'en-US',
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  };

  // =====================================================
  // RENDER STATUS
  // =====================================================

  const renderStatus = (
    status
  ) => {

    const safeStatus =
      status || 'Assigned';

    const className =
      safeStatus
        .toLowerCase()
        .replaceAll(
          ' ',
          '-'
        );

    return (
      <span
        className={`report-status status-${className}`}
      >
        {safeStatus}
      </span>
    );
  };

  // =====================================================
  // RENDER PRIORITY
  // =====================================================

  const renderPriority = (
    priority
  ) => {

    const safePriority =
      priority || 'Medium';

    return (
      <span
        className={`report-priority priority-${safePriority.toLowerCase()}`}
      >
        {safePriority}
      </span>
    );
  };

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="department-reports-page">

      {/* =================================================
          TOP BAR
      ================================================= */}

      <header className="reports-topbar">

        <div className="reports-topbar-left">

          <button
            className="reports-menu-button"
            onClick={() =>
              navigate('/staff')
            }
          >
            <Menu size={20} />
          </button>

          <h1>
            Assigned Incidents
          </h1>

        </div>

        <div className="reports-topbar-right">

          <div className="reports-search">

            <Search size={16} />

            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(
                  e.target.value
                );

                setCurrentPage(1);
              }}
            />

          </div>

          <button className="reports-notification">
            <Bell size={19} />

            <span>
              0
            </span>
          </button>

          <div className="reports-user">

            <div className="reports-user-avatar">
              <User size={18} />
            </div>

            <div>
              <strong>
                {currentUser?.name ||
                  'Staff Member'}
              </strong>

              <small>
                {currentUser?.role ||
                  'Staff'}
              </small>
            </div>

            <ChevronDown size={15} />

          </div>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="reports-main">

        {/* =================================================
            DEPARTMENT HEADER
        ================================================= */}

        <section className="department-heading">

          <div className="department-heading-left">

            <div className="department-icon">
              <Users size={29} />
            </div>

            <div>

              <h2>
                {staffDepartment}
              </h2>

              <p>
                Handle assigned incidents and
                submit your response to Admin.
              </p>

            </div>

          </div>

          <div className="department-info-box">

            <div className="info-circle">
              i
            </div>

            <p>
              You can only view and manage
              incidents assigned to your
              department.
              For further assistance, contact
              the Admin.
            </p>

          </div>

        </section>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <section className="report-summary-grid">

          <div className="report-summary-card">

            <div className="summary-icon blue">
              <UserCheck size={20} />
            </div>

            <div>

              <span>
                Assigned to Me
              </span>

              <strong>
                {assignedToMe}
              </strong>

            </div>

          </div>

          <div className="report-summary-card">

            <div className="summary-icon blue">
              <LoaderCircle size={21} />
            </div>

            <div>

              <span>
                In Progress
              </span>

              <strong>
                {inProgress}
              </strong>

            </div>

          </div>

          <div className="report-summary-card">

            <div className="summary-icon purple">
              <FileCheck size={21} />
            </div>

            <div>

              <span>
                Resolution Submitted
              </span>

              <strong>
                {resolutionSubmitted}
              </strong>

            </div>

          </div>

          <div className="report-summary-card">

            <div className="summary-icon green">
              <CheckCircle size={21} />
            </div>

            <div>

              <span>
                Resolved
              </span>

              <strong>
                {resolved}
              </strong>

            </div>

          </div>

          <div className="report-summary-card">

            <div className="summary-icon gray">
              <ClipboardList size={21} />
            </div>

            <div>

              <span>
                Total (This Department)
              </span>

              <strong>
                {totalDepartment}
              </strong>

            </div>

          </div>

        </section>

        {/* =================================================
            REPORT AREA
        ================================================= */}

        <section className="reports-workspace">

          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <div className="reports-table-section">

            {/* FILTERS */}

            <div className="reports-filters">

              <div className="reference-search">

                <Search size={17} />

                <input
                  type="text"
                  placeholder="Search by Reference ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(
                      e.target.value
                    );

                    setCurrentPage(1);
                  }}
                />

              </div>

              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(
                    e.target.value
                  );

                  setCurrentPage(1);
                }}
              >
                <option>
                  All Departments
                </option>

                <option>
                  {staffDepartment}
                </option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(
                    e.target.value
                  );

                  setCurrentPage(1);
                }}
              >
                <option>
                  All Statuses
                </option>

                <option>
                  Assigned
                </option>

                <option>
                  In Progress
                </option>

                <option>
                  Resolution Submitted
                </option>

                <option>
                  Awaiting Admin Verification
                </option>

                <option>
                  Resolved
                </option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(
                    e.target.value
                  );

                  setCurrentPage(1);
                }}
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

              <button
                className="filter-button"
                onClick={clearFilters}
                title="Clear filters"
              >
                <Filter size={17} />
              </button>

            </div>

            {/* TABLE */}

            <div className="reports-table-wrapper">

              <table className="reports-table">

                <thead>

                  <tr>

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

                  {paginatedIncidents.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan={7}
                        className="no-reports"
                      >

                        <ClipboardList
                          size={40}
                        />

                        <strong>
                          No assigned incidents
                        </strong>

                        <span>
                          Incidents assigned by
                          Admin to this department
                          will appear here.
                        </span>

                      </td>

                    </tr>

                  ) : (

                    paginatedIncidents.map(
                      (incident) => {

                        const referenceId =
                          incident.referenceId ||
                          incident.id ||
                          '—';

                        return (
                          <tr
                            key={referenceId}
                            className={
                              selectedIncident?.id ===
                                incident.id ||
                              selectedIncident?.referenceId ===
                                incident.referenceId
                                ? 'selected-row'
                                : ''
                            }
                          >

                            <td>
                              <strong>
                                {referenceId}
                              </strong>
                            </td>

                            <td>
                              {incident.category ||
                                '—'}
                            </td>

                            <td>
                              {incident.location ||
                                '—'}
                            </td>

                            <td>
                              {formatDate(
                                incident.date ||
                                  incident.createdAt
                              )}
                            </td>

                            <td>
                              {renderPriority(
                                incident.priority
                              )}
                            </td>

                            <td>
                              {renderStatus(
                                incident.status
                              )}
                            </td>

                            <td>

                              <button
                                className="view-report-button"
                                onClick={() =>
                                  handleViewIncident(
                                    incident
                                  )
                                }
                              >
                                View
                              </button>

                            </td>

                          </tr>
                        );
                      }
                    )

                  )}

                </tbody>

              </table>

              {/* PAGINATION */}

              <div className="reports-pagination">

                <span>
                  Showing{' '}
                  {filteredIncidents.length ===
                  0
                    ? 0
                    : (currentPage - 1) *
                        itemsPerPage +
                      1}
                  –
                  {Math.min(
                    currentPage *
                      itemsPerPage,
                    filteredIncidents.length
                  )}{' '}
                  of{' '}
                  {filteredIncidents.length}{' '}
                  incidents
                </span>

                <div className="pagination-buttons">

                  <button
                    disabled={
                      currentPage === 1
                    }
                    onClick={() =>
                      changePage(
                        currentPage - 1
                      )
                    }
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span className="page-number">
                    {currentPage}
                  </span>

                  <button
                    disabled={
                      currentPage >=
                      totalPages
                    }
                    onClick={() =>
                      changePage(
                        currentPage + 1
                      )
                    }
                  >
                    <ChevronRight size={16} />
                  </button>

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              RIGHT SIDE DETAILS
          ================================================= */}

          <aside className="incident-details">

            {!selectedIncident ? (

              <div className="no-selected-incident">

                <ClipboardList
                  size={45}
                />

                <h3>
                  Select an incident
                </h3>

                <p>
                  Click View on an assigned
                  incident to see its details.
                </p>

              </div>

            ) : (

              <>

                {/* INCIDENT HEADER */}

                <div className="incident-details-header">

                  <div>

                    <h2>
                      {selectedIncident.referenceId ||
                        selectedIncident.id}
                    </h2>

                    <h3>
                      {selectedIncident.title ||
                        selectedIncident.incident ||
                        selectedIncident.category ||
                        'Incident'}
                    </h3>

                  </div>

                  {renderPriority(
                    selectedIncident.priority
                  )}

                </div>

                {/* META */}

                <div className="incident-meta">

                  <div>
                    <CalendarDays size={16} />

                    <span>
                      {formatDate(
                        selectedIncident.date ||
                          selectedIncident.createdAt
                      )}
                    </span>
                  </div>

                  <div>
                    <MapPin size={16} />

                    <span>
                      {selectedIncident.location ||
                        'Location not provided'}
                    </span>
                  </div>

                  <div>
                    <User size={16} />

                    <span>
                      Assigned by:{' '}
                      <strong>
                        {selectedIncident.assignedBy ||
                          'Admin'}
                      </strong>
                    </span>
                  </div>

                  <div>
                    <Building2 size={16} />

                    <span>
                      Assigned Department:{' '}
                      <strong>
                        {selectedIncident.assignedDepartment ||
                          selectedIncident.department ||
                          staffDepartment}
                      </strong>
                    </span>
                  </div>

                </div>

                {/* DESCRIPTION */}

                <div className="incident-description">

                  <h4>
                    Description
                  </h4>

                  <p>
                    {selectedIncident.description ||
                      selectedIncident.problem ||
                      'No description provided.'}
                  </p>

                </div>

                {/* ATTACHMENTS */}

                <div className="incident-attachments">

                  <h4>
                    <Paperclip size={15} />
                    Attachments
                  </h4>

                  {selectedIncident.attachment ||
                  selectedIncident.evidence ? (

                    <div className="attachment-item">

                      <div className="attachment-icon">
                        <FileCheck
                          size={20}
                        />
                      </div>

                      <div>

                        <strong>
                          {selectedIncident.attachment ||
                            selectedIncident.evidence}
                        </strong>

                        <span>
                          Evidence
                        </span>

                      </div>

                      <Download
                        size={17}
                      />

                    </div>

                  ) : (

                    <p className="no-attachment">
                      No attachments
                    </p>

                  )}

                </div>

                {/* STATUS TIMELINE */}

                <div className="status-timeline-section">

                  <h4>
                    Status Timeline
                  </h4>

                  <div className="status-timeline">

                    {getTimelineSteps(
                      selectedIncident
                    ).map(
                      (
                        step,
                        index,
                        array
                      ) => (

                        <div
                          className="timeline-step"
                          key={step.label}
                        >

                          <div
                            className={`timeline-dot ${
                              step.completed
                                ? 'completed'
                                : ''
                            } ${
                              step.active
                                ? 'active'
                                : ''
                            }`}
                          >
                            {step.completed
                              ? '✓'
                              : ''}
                          </div>

                          {index <
                            array.length -
                              1 && (
                            <div
                              className={`timeline-line ${
                                step.completed &&
                                array[
                                  index + 1
                                ]
                                  .completed
                                  ? 'completed'
                                  : ''
                              }`}
                            />
                          )}

                          <span>
                            {step.label}
                          </span>

                        </div>

                      )
                    )}

                  </div>

                </div>

                {/* RESPONSE */}

                <div className="response-section">

                  <h4>
                    Your Action / Response
                  </h4>

                  {selectedIncident.status ===
                    'Resolved' ? (

                    <div className="already-resolved">

                      <CheckCircle
                        size={20}
                      />

                      <div>

                        <strong>
                          Incident Resolved
                        </strong>

                        <p>
                          Admin has verified and
                          marked this incident as
                          resolved.
                        </p>

                      </div>

                    </div>

                  ) : selectedIncident.status ===
                    'Resolution Submitted' ||
                    selectedIncident.status ===
                    'Awaiting Admin Verification' ? (

                    <div className="resolution-submitted-box">

                      <Send size={19} />

                      <div>

                        <strong>
                          Resolution Submitted
                        </strong>

                        <p>
                          Your response has been
                          sent to Admin. The
                          incident will be marked
                          Resolved only after Admin
                          verifies it.
                        </p>

                        {selectedIncident.resolutionMessage && (
                          <div className="submitted-message">
                            <strong>
                              Your response:
                            </strong>

                            <p>
                              {
                                selectedIncident.resolutionMessage
                              }
                            </p>
                          </div>
                        )}

                      </div>

                    </div>

                  ) : (

                    <>

                      <textarea
                        value={response}
                        onChange={(e) =>
                          setResponse(
                            e.target.value
                          )
                        }
                        placeholder="Describe the action you have taken..."
                        disabled={
                          selectedIncident.status ===
                          'Resolved'
                        }
                      />

                      <div className="evidence-upload">

                        <label>

                          <Paperclip
                            size={16}
                          />

                          Upload Evidence

                          <span>
                            (Optional)
                          </span>

                          <input
                            type="file"
                            onChange={
                              handleEvidenceUpload
                            }
                          />

                        </label>

                        {evidence && (
                          <span className="selected-file">
                            {evidence.name}
                          </span>
                        )}

                      </div>

                      <div className="response-actions">

                        <button
                          className="cancel-response"
                          onClick={() => {
                            setResponse('');
                            setEvidence(null);
                          }}
                        >
                          Cancel
                        </button>

                        <button
                          className="submit-response"
                          onClick={
                            handleSubmitUpdate
                          }
                          disabled={
                            submitting
                          }
                        >

                          {submitting ? (
                            <>
                              <LoaderCircle
                                size={17}
                                className="spin"
                              />

                              Sending...
                            </>
                          ) : (
                            <>
                              <Send
                                size={16}
                              />

                              Submit Update
                            </>
                          )}

                        </button>

                      </div>

                    </>

                  )}

                </div>

              </>

            )}

          </aside>

        </section>

      </main>

    </div>
  );
}

export default DepartmentReports;