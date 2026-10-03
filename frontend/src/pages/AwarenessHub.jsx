import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  ArrowLeft, 
  BookOpen, 
  Phone, 
  AlertTriangle, 
  Heart,
  HelpCircle,
  FileText,
  Search,
  ChevronRight
} from 'lucide-react';
import '../styles/designSystem.css';
import '../styles/awarenessHub.css';

function AwarenessHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const currentUser = localStorage.getItem('sentraCurrentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      setUserRole(user.role || '');
    }
  }, []);

  const handleBackToDashboard = () => {
    // Always navigate to landing page
    navigate('/');
  };

  const categories = [
    { id: 'all', name: 'All Resources' },
    { id: 'policies', name: 'Campus Policies' },
    { id: 'safety', name: 'Safety Guidelines' },
    { id: 'helpline', name: 'Helpline Details' },
    { id: 'prevention', name: 'Prevention Tips' },
    { id: 'emergency', name: 'Emergency Info' },
    { id: 'faq', name: 'FAQs' }
  ];

  const resources = [
    {
      id: 1,
      category: 'policies',
      title: 'Campus Safety Policy',
      description: 'Comprehensive guide to campus safety regulations and procedures.',
      icon: BookOpen,
      color: 'primary'
    },
    {
      id: 2,
      category: 'helpline',
      title: '24/7 Emergency Helpline',
      description: 'Contact campus security and emergency services anytime.',
      icon: Phone,
      color: 'error'
    },
    {
      id: 3,
      category: 'safety',
      title: 'Personal Safety Guidelines',
      description: 'Tips and best practices for staying safe on campus.',
      icon: Shield,
      color: 'success'
    },
    {
      id: 4,
      category: 'prevention',
      title: 'Incident Prevention',
      description: 'Learn how to identify and prevent potential safety incidents.',
      icon: AlertTriangle,
      color: 'warning'
    },
    {
      id: 5,
      category: 'emergency',
      title: 'Emergency Procedures',
      description: 'Step-by-step guides for various emergency situations.',
      icon: AlertTriangle,
      color: 'error'
    },
    {
      id: 6,
      category: 'helpline',
      title: 'Counseling Services',
      description: 'Mental health support and counseling resources.',
      icon: Heart,
      color: 'primary'
    },
    {
      id: 7,
      category: 'faq',
      title: 'Frequently Asked Questions',
      description: 'Common questions about incident reporting and campus safety.',
      icon: HelpCircle,
      color: 'info'
    },
    {
      id: 8,
      category: 'policies',
      title: 'Reporting Procedures',
      description: 'Detailed procedures for reporting different types of incidents.',
      icon: FileText,
      color: 'secondary'
    }
  ];

  const emergencyContacts = [
    { name: 'Campus Security', phone: '555-0100', available: '24/7' },
    { name: 'Emergency Services', phone: '911', available: '24/7' },
    { name: 'Counseling Center', phone: '555-0101', available: '8AM - 8PM' },
    { name: 'Health Services', phone: '555-0102', available: '9AM - 5PM' }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesCategory = activeCategory === 'all' || resource.category === activeCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getResourceColor = (color) => {
    const colors = {
      primary: 'resource-primary',
      secondary: 'resource-secondary',
      success: 'resource-success',
      warning: 'resource-warning',
      error: 'resource-error',
      info: 'resource-info'
    };
    return colors[color] || colors.primary;
  };

  const handleViewResource = (resource) => {
    console.log('Viewing resource:', resource);
    // In real app, this would navigate to a detailed resource page
  };

  return (
    <div className="awareness-hub-container">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <button className="back-btn" onClick={handleBackToDashboard}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <div className="header-content">
            <Shield size={36} />
            <div>
              <h1>Awareness Hub</h1>
              <p>Safety resources, guidelines, and support services</p>
            </div>
          </div>
        </div>

        {/* Emergency Banner */}
        <div className="emergency-banner">
          <div className="emergency-content">
            <div className="emergency-icon">
              <Phone size={32} />
            </div>
            <div className="emergency-text">
              <h2>Emergency Contacts</h2>
              <p>If you're in immediate danger, call Campus Security at 555-0100 or Emergency Services at 911</p>
            </div>
          </div>
          <div className="emergency-actions">
            <button className="btn btn-error btn-lg">
              <Phone size={20} />
              Call Campus Security
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="search-filter-section">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              className="input"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-tabs">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        <section className="resources-section">
          <h2>Safety Resources</h2>
          <div className="resources-grid">
            {filteredResources.map(resource => {
              const Icon = resource.icon;
              return (
                <div key={resource.id} className="resource-card">
                  <div className={`resource-icon ${getResourceColor(resource.color)}`}>
                    <Icon size={28} />
                  </div>
                  <div className="resource-content">
                    <h3>{resource.title}</h3>
                    <p>{resource.description}</p>
                  </div>
                  <button 
                    className="resource-action"
                    onClick={() => handleViewResource(resource)}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              );
            })}
          </div>

          {filteredResources.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Search size={48} />
              </div>
              <h3 className="empty-state-title">No resources found</h3>
              <p className="empty-state-description">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </section>

        {/* Emergency Contacts */}
        <section className="contacts-section">
          <h2>Emergency Contacts</h2>
          <div className="contacts-grid">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="contact-card">
                <div className="contact-icon">
                  <Phone size={24} />
                </div>
                <div className="contact-info">
                  <h3>{contact.name}</h3>
                  <p className="contact-phone">{contact.phone}</p>
                  <p className="contact-hours">{contact.available}</p>
                </div>
                <button className="btn btn-primary btn-sm">
                  Call Now
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Tips */}
        <section className="tips-section">
          <h2>Quick Safety Tips</h2>
          <div className="tips-list">
            <div className="tip-item">
              <div className="tip-number">1</div>
              <div className="tip-content">
                <h3>Stay Aware of Your Surroundings</h3>
                <p>Pay attention to what's happening around you, especially when walking alone at night.</p>
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-number">2</div>
              <div className="tip-content">
                <h3>Use Campus Safety Services</h3>
                <p>Take advantage of campus escort services and well-lit pathways.</p>
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-number">3</div>
              <div className="tip-content">
                <h3>Report Suspicious Activity</h3>
                <p>If you see something suspicious, report it immediately to campus security.</p>
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-number">4</div>
              <div className="tip-content">
                <h3>Keep Emergency Numbers Handy</h3>
                <p>Save campus security and emergency contacts in your phone.</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default AwarenessHub;