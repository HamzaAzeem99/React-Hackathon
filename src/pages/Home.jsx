import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../utils/dataService';
import { 
  Boxes, 
  AlertTriangle, 
  Wrench, 
  Ban, 
  PlusCircle, 
  Sun, 
  Moon,
  LogOut,
  RefreshCw,
  Search,
  User,
  Clock,
  Printer,
  Copy,
  ExternalLink,
  ChevronRight,
  UserCheck,
  FileText,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import './Home.css';

const TECHNICIANS = ["Demo Technician", "Sarah Connor (Electronics)", "Dave Miller (HVAC)", "Alex Stone (Plumbing)"];

function Home({ session, handleLogout, darkMode, toggleTheme, setGlobalLoading }) {
  const navigate = useNavigate();
  const user = session.user;
  const userRole = user.role || 'Admin'; // Admin, Technician, Reporter
  
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [issues, setIssues] = useState([]);
  
  // Dashboard Analytics
  const [stats, setStats] = useState({ totalAssets: 0, activeIssues: 0, underMaintenance: 0, outOfService: 0 });

  // Filters & Search
  const [activeTab, setActiveTab] = useState('assets'); // assets, issues
  const [assetSearch, setAssetSearch] = useState('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('');
  const [assetStatusFilter, setAssetStatusFilter] = useState('');
  
  const [issueSearch, setIssueSearch] = useState('');
  const [issuePriorityFilter, setIssuePriorityFilter] = useState('');
  const [issueStatusFilter, setIssueStatusFilter] = useState('');

  // Selection for bulk QR label sheets
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [showBulkQrModal, setShowBulkQrModal] = useState(false);

  // Inspector / Details Drawers
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetHistory, setAssetHistory] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Assignment Modal
  const [assigningIssue, setAssigningIssue] = useState(null);
  const [assignedTech, setAssignedTech] = useState(TECHNICIANS[0]);

  // Resolve Issue State
  const [resolvingIssue, setResolvingIssue] = useState(null);
  const [maintNotes, setMaintNotes] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [maintCost, setMaintCost] = useState(0);
  const [nextServiceDate, setNextServiceDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3); // Default 3 months from now
    return d.toISOString().split('T')[0];
  });
  const [resolveError, setResolveError] = useState('');

  // Copy success feedback
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const allAssets = await dataService.getAssets();
      const allIssues = await dataService.getIssues();
      
      setAssets(allAssets);
      setIssues(allIssues);

      // Compute analytics
      const totalAssets = allAssets.length;
      const activeIssues = allIssues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length;
      const underMaintenance = allAssets.filter(a => a.status === 'Under Maintenance' || a.status === 'Under Inspection').length;
      const outOfService = allAssets.filter(a => a.status === 'Out of Service').length;

      setStats({ totalAssets, activeIssues, underMaintenance, outOfService });

      // Refresh opened inspector data if active
      if (selectedAsset) {
        const updatedAsset = allAssets.find(a => a.id === selectedAsset.id);
        if (updatedAsset) {
          setSelectedAsset(updatedAsset);
          const history = await dataService.getHistory(updatedAsset.asset_code);
          setAssetHistory(history);
        }
      }
    } catch (err) {
      console.error("Error reloading dashboard database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectAsset = async (asset) => {
    setSelectedAsset(asset);
    setSelectedIssue(null);
    setLoading(true);
    try {
      const history = await dataService.getHistory(asset.asset_code);
      setAssetHistory(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (qrUrl, assetCode) => {
    navigator.clipboard.writeText(qrUrl);
    setCopiedCode(assetCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAssignTechnician = async (e) => {
    e.preventDefault();
    if (!assigningIssue) return;

    setGlobalLoading(true);
    try {
      const updatedIssue = {
        ...assigningIssue,
        status: 'Assigned',
        assigned_to: assignedTech
      };
      
      await dataService.saveIssue(updatedIssue);
      await dataService.addHistory(
        assigningIssue.asset_name_code || assigningIssue.asset_code,
        user.full_name || 'Admin',
        'Technician Assigned',
        `Issue assigned to technician: ${assignedTech}`
      );
      
      setAssigningIssue(null);
      await fetchAllData();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleStatusUpdate = async (issue, newStatus) => {
    setGlobalLoading(true);
    try {
      const updatedIssue = {
        ...issue,
        status: newStatus
      };

      // Map issue status changes to expected asset statuses (PDF Section 5.1 Rules)
      let assetStatus = 'Operational';
      let historyLabel = 'Status Updated';
      let historyDetails = `Ticket status transitioned to ${newStatus}`;

      if (newStatus === 'Inspection Started') {
        assetStatus = 'Under Inspection';
        historyLabel = 'Inspection Started';
        historyDetails = `Technician ${issue.assigned_to || 'Assigned Staff'} started inspection on asset.`;
      } else if (newStatus === 'Maintenance In Progress') {
        assetStatus = 'Under Maintenance';
        historyLabel = 'Repair Begun';
        historyDetails = `Repair work started on breakdown tickets.`;
      } else if (newStatus === 'Out of Service') {
        assetStatus = 'Out of Service';
        historyLabel = 'Critical Safety Issue';
        historyDetails = `Critical safety warning reported. Asset declared out of service.`;
      } else if (newStatus === 'Reopened') {
        assetStatus = 'Issue Reported';
        historyLabel = 'Ticket Reopened';
        historyDetails = `Maintenance ticket reopened for further review.`;
      }

      await dataService.saveIssue(updatedIssue);
      await dataService.updateAssetStatus(issue.asset_name_code || issue.asset_code, assetStatus);
      await dataService.addHistory(
        issue.asset_name_code || issue.asset_code,
        user.full_name || 'Staff',
        historyLabel,
        historyDetails
      );

      await fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleResolveIssue = async (e) => {
    e.preventDefault();
    if (!resolvingIssue) return;
    setResolveError('');

    // Validations (PDF Business Rules Section 5.2)
    if (!maintNotes.trim()) {
      setResolveError("Maintenance work notes cannot be blank.");
      return;
    }
    if (maintCost < 0) {
      setResolveError("Maintenance cost cannot be negative.");
      return;
    }
    const completionDate = new Date().toISOString().split('T')[0];
    if (nextServiceDate < completionDate) {
      setResolveError("Next service date cannot be in the past.");
      return;
    }

    setGlobalLoading(true);
    try {
      const updatedIssue = {
        ...resolvingIssue,
        status: 'Resolved',
        notes: maintNotes,
        parts_replaced: partsReplaced,
        cost: Number(maintCost),
        resolved_at: new Date().toISOString()
      };

      await dataService.saveIssue(updatedIssue);
      await dataService.updateAssetStatus(resolvingIssue.asset_name_code || resolvingIssue.asset_code, 'Operational');
      
      // Update next service date inside local state (simulation)
      const currentAssetObj = assets.find(a => a.asset_code === (resolvingIssue.asset_name_code || resolvingIssue.asset_code));
      if (currentAssetObj) {
        const updatedAsset = {
          ...currentAssetObj,
          last_service: completionDate,
          next_service: nextServiceDate
        };
        // Update in dataService
        await dataService.saveAsset(updatedAsset);
      }

      await dataService.addHistory(
        resolvingIssue.asset_name_code || resolvingIssue.asset_code,
        resolvingIssue.assigned_to || user.full_name || 'Technician',
        'Maintenance Completed',
        `Fixed: ${maintNotes}. Cost: $${maintCost}. Next service scheduled: ${nextServiceDate}`
      );

      setResolvingIssue(null);
      setMaintNotes('');
      setPartsReplaced('');
      setMaintCost(0);
      await fetchAllData();
    } catch (err) {
      setResolveError(err.message);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to restore preloaded demo assets and wipe issues?")) {
      setGlobalLoading(true);
      setTimeout(() => {
        dataService.resetData();
        setSelectedAsset(null);
        setSelectedIssue(null);
        fetchAllData();
        setGlobalLoading(false);
      }, 800);
    }
  };

  const toggleAssetSelection = (id) => {
    setSelectedAssetIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Filter logic
  const filteredAssets = assets.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(assetSearch.toLowerCase()) || 
                        a.asset_code.toLowerCase().includes(assetSearch.toLowerCase()) ||
                        a.location.toLowerCase().includes(assetSearch.toLowerCase());
    const matchCategory = assetCategoryFilter ? a.category === assetCategoryFilter : true;
    const matchStatus = assetStatusFilter ? a.status === assetStatusFilter : true;
    return matchSearch && matchCategory && matchStatus;
  });

  // Technician sees only assigned, Admin sees all
  const filteredIssues = issues.filter(i => {
    if (userRole === 'Technician' && i.assigned_to !== user.full_name) {
      return false;
    }
    const matchSearch = i.title.toLowerCase().includes(issueSearch.toLowerCase()) ||
                        i.issue_number.toLowerCase().includes(issueSearch.toLowerCase()) ||
                        i.asset_name.toLowerCase().includes(issueSearch.toLowerCase());
    const matchPriority = issuePriorityFilter ? i.priority === issuePriorityFilter : true;
    const matchStatus = issueStatusFilter ? i.status === issueStatusFilter : true;
    return matchSearch && matchPriority && matchStatus;
  });

  return (
    <div className={`dashboard-container ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      
      {/* --- HEADER --- */}
      <header className="dashboard-header-green-3d">
        <div className="header-left">
          <h1>MaintainIQ <span className="vip-badge-green">VIP Premium</span></h1>
          <div className="user-role-badge">
            <User size={14} />
            <span>Logged in: <strong>{user.full_name || user.email}</strong> ({userRole})</span>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="theme-toggle-btn-green" onClick={toggleTheme} aria-label="Toggle Theme">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span>{darkMode ? 'Day Mode' : 'Night Mode'}</span>
          </button>
          
          {userRole === 'Admin' && (
            <button className="btn-primary-green-3d" onClick={() => navigate('/register-asset')}>
              <PlusCircle size={18} />
              <span>Register Asset</span>
            </button>
          )}

          <button className="btn-reset-data" onClick={handleResetData} title="Reset Demo Data">
            <RefreshCw size={14} /> Reset Data
          </button>

          <button className="btn-logout-green" onClick={handleLogout} title="Sign Out of System">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* --- STATS OVERVIEW --- */}
      <section className="stats-grid animate-fade-in">
        <div className="stat-card-green-3d total-assets">
          <div className="stat-icon-container"><Boxes size={28} /></div>
          <div className="stat-info">
            <h3>Registered Assets</h3>
            <p className="stat-number">{stats.totalAssets}</p>
          </div>
        </div>

        <div className="stat-card-green-3d active-issues">
          <div className="stat-icon-container"><AlertTriangle size={28} /></div>
          <div className="stat-info">
            <h3>Active Issues</h3>
            <p className="stat-number">{stats.activeIssues}</p>
          </div>
        </div>

        <div className="stat-card-green-3d under-maint">
          <div className="stat-icon-container"><Wrench size={28} /></div>
          <div className="stat-info">
            <h3>Under Inspection/Maint</h3>
            <p className="stat-number">{stats.underMaintenance}</p>
          </div>
        </div>

        <div className="stat-card-green-3d out-of-service">
          <div className="stat-icon-container"><Ban size={28} /></div>
          <div className="stat-info">
            <h3>Out of Service</h3>
            <p className="stat-number">{stats.outOfService}</p>
          </div>
        </div>
      </section>

      {/* --- DASHBOARD CONTENT SPLIT GRID --- */}
      <div className="dashboard-content-split">
        
        {/* LEFT COLUMN: TICKETS & ASSETS VIEWS */}
        <div className="content-left-panel">
          
          {/* TAB NAVIGATION */}
          <div className="dashboard-tabs">
            <button 
              className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
              onClick={() => setActiveTab('assets')}
            >
              📦 Corporate Asset Register
            </button>
            <button 
              className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
              onClick={() => setActiveTab('issues')}
            >
              🔔 Maintenance Tickets {filteredIssues.length > 0 && <span className="tab-indicator">{filteredIssues.length}</span>}
            </button>
          </div>

          {/* TAB 1: ASSETS */}
          {activeTab === 'assets' && (
            <div className="tab-content-card animate-fade-in">
              <div className="filter-search-row">
                <div className="search-box-3d">
                  <Search size={16} className="search-ico" />
                  <input 
                    type="text" 
                    placeholder="Search by code, name, room location..." 
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                  />
                </div>
                <div className="filters-group">
                  <select value={assetCategoryFilter} onChange={(e) => setAssetCategoryFilter(e.target.value)}>
                    <option value="">All Categories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="HVAC / AC">HVAC / AC</option>
                  </select>

                  <select value={assetStatusFilter} onChange={(e) => setAssetStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="Operational">Operational</option>
                    <option value="Issue Reported">Issue Reported</option>
                    <option value="Under Inspection">Under Inspection</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>

              {userRole === 'Admin' && filteredAssets.length > 0 && (
                <div className="bulk-qr-actions-row">
                  <button 
                    className="btn-bulk-qr" 
                    disabled={selectedAssetIds.length === 0}
                    onClick={() => setShowBulkQrModal(true)}
                  >
                    <Printer size={14} /> Generate Bulk QR Sheet ({selectedAssetIds.length} Selected)
                  </button>
                </div>
              )}

              {loading && assets.length === 0 ? (
                <div className="spinner-zone">🔄 Querying digital register...</div>
              ) : filteredAssets.length === 0 ? (
                <div className="empty-zone">No assets match your search filters.</div>
              ) : (
                <div className="table-responsive">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        {userRole === 'Admin' && <th style={{ width: '40px' }}>Select</th>}
                        <th>Code</th>
                        <th>Asset Name</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Inspect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map(asset => (
                        <tr 
                          key={asset.id} 
                          onClick={() => handleSelectAsset(asset)}
                          className={selectedAsset && selectedAsset.id === asset.id ? 'active-row' : ''}
                        >
                          {userRole === 'Admin' && (
                            <td onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox"
                                checked={selectedAssetIds.includes(asset.id)}
                                onChange={() => toggleAssetSelection(asset.id)}
                              />
                            </td>
                          )}
                          <td className="bold-text text-green-dark">{asset.asset_code}</td>
                          <td>{asset.name}</td>
                          <td>{asset.category}</td>
                          <td>{asset.location}</td>
                          <td>
                            <span className={`status-pill ${asset.status.toLowerCase().replace(/ /g, '-')}`}>
                              {asset.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <ChevronRight size={16} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TICKETS */}
          {activeTab === 'issues' && (
            <div className="tab-content-card animate-fade-in">
              <div className="filter-search-row">
                <div className="search-box-3d">
                  <Search size={16} className="search-ico" />
                  <input 
                    type="text" 
                    placeholder="Search ticket ID, title, asset..." 
                    value={issueSearch}
                    onChange={(e) => setIssueSearch(e.target.value)}
                  />
                </div>
                <div className="filters-group">
                  <select value={issuePriorityFilter} onChange={(e) => setIssuePriorityFilter(e.target.value)}>
                    <option value="">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                  <select value={issueStatusFilter} onChange={(e) => setIssueStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="Reported">Reported</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Inspection Started">Inspection Started</option>
                    <option value="Maintenance In Progress">Maintenance In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {filteredIssues.length === 0 ? (
                <div className="empty-zone">No maintenance tickets matching selection.</div>
              ) : (
                <div className="tickets-grid">
                  {filteredIssues.map(issue => (
                    <div 
                      key={issue.id} 
                      className={`ticket-card-3d ${issue.priority.toLowerCase()} ${selectedIssue && selectedIssue.id === issue.id ? 'active-ticket' : ''}`}
                      onClick={() => {
                        setSelectedIssue(issue);
                        setSelectedAsset(null);
                      }}
                    >
                      <div className="ticket-header-row">
                        <span className="ticket-number">{issue.issue_number}</span>
                        <span className={`priority-tag ${issue.priority.toLowerCase()}`}>{issue.priority}</span>
                      </div>
                      
                      <h4>{issue.title}</h4>
                      <p className="ticket-asset-desc">Asset: <strong>{issue.asset_name}</strong></p>
                      
                      <div className="ticket-footer-row">
                        <span className="ticket-status-val">{issue.status}</span>
                        {issue.assigned_to && (
                          <span className="tech-assigned-tag">👤 {issue.assigned_to}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: INSPECTOR DRAWER */}
        <div className="content-right-panel">
          
          {/* ASSET DETAIL INSPECTOR */}
          {selectedAsset && (
            <div className="inspector-card animate-slide-up">
              <div className="inspector-header">
                <h3>Asset Digital Identity</h3>
                <button className="btn-close-inspect" onClick={() => setSelectedAsset(null)}>✕</button>
              </div>

              <div className="asset-profile-sheet">
                <div className="info-block">
                  <span className="label">Asset Name</span>
                  <p className="val bold-val">{selectedAsset.name}</p>
                </div>

                <div className="info-block">
                  <span className="label">Asset Code / Category</span>
                  <p className="val">{selectedAsset.asset_code} • {selectedAsset.category}</p>
                </div>

                <div className="info-block">
                  <span className="label">Current Location</span>
                  <p className="val">{selectedAsset.location}</p>
                </div>

                <div className="info-block">
                  <span className="label">Physical Condition / Status</span>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span className={`status-pill ${selectedAsset.status.toLowerCase().replace(/ /g, '-')}`}>
                      {selectedAsset.status}
                    </span>
                  </div>
                </div>

                {selectedAsset.last_service && (
                  <div className="service-dates-row">
                    <div>
                      <span className="label">Last Serviced</span>
                      <p className="val-small">{selectedAsset.last_service}</p>
                    </div>
                    <div>
                      <span className="label">Next Service Due</span>
                      <p className="val-small bold-text text-green-dark">{selectedAsset.next_service}</p>
                    </div>
                  </div>
                )}

                <hr className="divider" />

                {/* QR BARCODE LABEL PREVIEW CONTAINER */}
                <div className="qr-barcode-preview-box">
                  <h4>Printable Asset Label Identification</h4>
                  <div className="print-label-sticker" id={`label-${selectedAsset.asset_code}`}>
                    <div className="sticker-head">MaintainIQ Asset Label</div>
                    <div className="sticker-body">
                      <div className="sticker-qr">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(selectedAsset.qr_url || window.location.origin + '/asset/' + selectedAsset.asset_code)}`} 
                          alt="QR ID" 
                        />
                      </div>
                      <div className="sticker-info">
                        <p className="st-name">{selectedAsset.name}</p>
                        <p className="st-code">CODE: {selectedAsset.asset_code}</p>
                        <p className="st-loc">LOC: {selectedAsset.location}</p>
                        <p className="st-desc">Scan to report breakdowns instantly</p>
                      </div>
                    </div>
                  </div>

                  <div className="qr-utility-buttons">
                    <button className="qr-btn" onClick={() => window.print()} title="Print single tag">
                      <Printer size={14} /> Print
                    </button>
                    <button className="qr-btn" onClick={() => handleCopyLink(selectedAsset.qr_url || window.location.origin + '/asset/' + selectedAsset.asset_code, selectedAsset.asset_code)} title="Copy URL Link">
                      <Copy size={14} /> {copiedCode === selectedAsset.asset_code ? "Copied!" : "Link"}
                    </button>
                    <a className="qr-btn" href={`/asset/${selectedAsset.asset_code}`} target="_blank" rel="noopener noreferrer" title="View Public Asset Profile">
                      <ExternalLink size={14} /> Open
                    </a>
                  </div>
                </div>

                <hr className="divider" />

                {/* HISTORY TIMELINE */}
                <div className="history-timeline-section">
                  <h4>Permanent Service Timeline</h4>
                  <p className="timeline-caption"><Clock size={12} /> Encrypted ledger. History cannot be deleted or modified.</p>
                  
                  {assetHistory.length === 0 ? (
                    <p className="empty-timeline">No history recorded yet.</p>
                  ) : (
                    <div className="timeline-list">
                      {assetHistory.map((item, idx) => (
                        <div key={item.id || idx} className="timeline-item">
                          <div className="timeline-node"></div>
                          <div className="timeline-content">
                            <span className="time">{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <h5 className="action">{item.action}</h5>
                            <p className="details">{item.details}</p>
                            <span className="actor">By: <strong>{item.actor}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TICKET DETAILS INSPECTOR */}
          {selectedIssue && (
            <div className="inspector-card animate-slide-up">
              <div className="inspector-header">
                <h3>Maintenance Ticket Inspector</h3>
                <button className="btn-close-inspect" onClick={() => setSelectedIssue(null)}>✕</button>
              </div>

              <div className="ticket-profile-sheet">
                <span className={`priority-tag ${selectedIssue.priority.toLowerCase()}`}>{selectedIssue.priority} Priority</span>
                <span className="ticket-inspector-num">{selectedIssue.issue_number}</span>

                <h3 className="ticket-inspect-title">{selectedIssue.title}</h3>
                
                <div className="info-block">
                  <span className="label">Target Asset</span>
                  <p className="val bold-val">{selectedIssue.asset_name} ({selectedIssue.asset_name_code || selectedIssue.asset_code})</p>
                </div>

                <div className="info-block">
                  <span className="label">User Complaint Summary</span>
                  <p className="val description-quote">"{selectedIssue.description}"</p>
                </div>

                {selectedIssue.reported_by && (
                  <div className="info-block">
                    <span className="label">Reporter Details</span>
                    <p className="val">👤 {selectedIssue.reported_by}</p>
                  </div>
                )}

                {selectedIssue.is_ai_triage && (
                  <div className="ai-metadata-box">
                    <div className="ai-badge-row">
                      <Sparkles size={14} /> AI Triage Triage Report Verified
                    </div>
                    {selectedIssue.possible_causes && (
                      <p><strong>Suspected Mechanical Causes:</strong> {selectedIssue.possible_causes}</p>
                    )}
                    {selectedIssue.safety_checks && (
                      <p className="safety-notes-warning"><strong>⚠️ Diagnostic Safety Instruction:</strong> {selectedIssue.safety_checks}</p>
                    )}
                  </div>
                )}

                <div className="info-block" style={{ marginTop: '1.25rem' }}>
                  <span className="label">Ticket Status</span>
                  <p className="val bold-text text-green-dark">{selectedIssue.status}</p>
                </div>

                {selectedIssue.notes && (
                  <div className="resolved-work-box animate-fade-in">
                    <h5>Resolved Work Summary</h5>
                    <p><strong>Notes:</strong> {selectedIssue.notes}</p>
                    {selectedIssue.parts_replaced && <p><strong>Parts replaced:</strong> {selectedIssue.parts_replaced}</p>}
                    <p><strong>Total maintenance cost:</strong> ${selectedIssue.cost}</p>
                    <p><strong>Resolution timestamp:</strong> {new Date(selectedIssue.resolved_at).toLocaleString()}</p>
                  </div>
                )}

                <hr className="divider" />

                {/* WORKFLOW OPERATIONS FOR ADMIN AND TECHNICIAN */}
                <div className="workflow-control-zone">
                  <h4>Workflow Status Controls</h4>

                  {/* 1. Admin assigns technician */}
                  {userRole === 'Admin' && selectedIssue.status === 'Reported' && (
                    <button className="btn-workflow assign" onClick={() => setAssigningIssue(selectedIssue)}>
                      <UserCheck size={16} /> Assign Technician
                    </button>
                  )}

                  {/* 2. Technician workflow steppers */}
                  {userRole === 'Technician' && selectedIssue.assigned_to === user.full_name && (
                    <div className="tech-actions-wrapper">
                      {selectedIssue.status === 'Assigned' && (
                        <button 
                          className="btn-workflow inspect"
                          onClick={() => handleStatusUpdate(selectedIssue, 'Inspection Started')}
                        >
                          🔍 Begin Initial Inspection
                        </button>
                      )}

                      {selectedIssue.status === 'Inspection Started' && (
                        <button 
                          className="btn-workflow repair"
                          onClick={() => handleStatusUpdate(selectedIssue, 'Maintenance In Progress')}
                        >
                          🛠️ Start Repair / Maintenance
                        </button>
                      )}

                      {(selectedIssue.status === 'Maintenance In Progress' || selectedIssue.status === 'Inspection Started') && (
                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                          <button 
                            className="btn-workflow resolve"
                            style={{ flex: 1 }}
                            onClick={() => setResolvingIssue(selectedIssue)}
                          >
                            ✓ Mark Issue Resolved
                          </button>
                          <button 
                            className="btn-workflow out-service"
                            style={{ background: '#ef4444', color: 'white', flex: 1 }}
                            onClick={() => handleStatusUpdate(selectedIssue, 'Out of Service')}
                          >
                            ⚠️ Out of Service
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Reopening Ticket */}
                  {selectedIssue.status === 'Resolved' && (
                    <button 
                      className="btn-workflow reopen"
                      onClick={() => handleStatusUpdate(selectedIssue, 'Reopened')}
                    >
                      🔄 Reopen Maintenance Ticket
                    </button>
                  )}

                  {!selectedIssue.assigned_to && selectedIssue.status === 'Reported' && userRole === 'Technician' && (
                    <p className="workflow-hint">Waiting for system administrator to assign this ticket.</p>
                  )}
                </div>

              </div>
            </div>
          )}

          {!selectedAsset && !selectedIssue && (
            <div className="inspector-placeholder">
              <FileText size={64} className="placeholder-icon" />
              <h3>Inspector Display</h3>
              <p>Select any corporate asset or maintenance ticket to inspect details, QR barcodes, timelines, and status workflow controls.</p>
            </div>
          )}

        </div>

      </div>

      {/* --- MODAL 1: ASSIGN TECHNICIAN --- */}
      {assigningIssue && (
        <div className="modal-overlay">
          <div className="modal-card animate-slide-up">
            <h3>Assign Ticket {assigningIssue.issue_number}</h3>
            <p>Select an authorized corporate technician to dispatch for this maintenance ticket:</p>
            
            <form onSubmit={handleAssignTechnician} className="modal-form">
              <div className="form-group-3d">
                <label>Available Technicians</label>
                <select value={assignedTech} onChange={(e) => setAssignedTech(e.target.value)}>
                  {TECHNICIANS.map((tech, idx) => (
                    <option key={idx} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setAssigningIssue(null)}>Cancel</button>
                <button type="submit" className="btn-modal-submit">Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: RESOLVE TICKET (WITH VALIDATIONS) --- */}
      {resolvingIssue && (
        <div className="modal-overlay">
          <div className="modal-card animate-slide-up">
            <h3>Resolve Ticket {resolvingIssue.issue_number}</h3>
            <p>Submit complete repair notes, parts replaced, and costs before finalizing status change.</p>

            <form onSubmit={handleResolveIssue} className="modal-form">
              {resolveError && (
                <div className="modal-error-box">
                  <AlertOctagon size={16} /> <span>{resolveError}</span>
                </div>
              )}

              <div className="form-group-3d">
                <label>Maintenance & Work Notes (Required)</label>
                <textarea 
                  rows="3" 
                  placeholder="Describe repair actions, troubleshooting completed, and final asset condition..."
                  value={maintNotes}
                  onChange={(e) => setMaintNotes(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="form-group-3d">
                <label>Replacement Parts Used</label>
                <input 
                  type="text" 
                  placeholder="e.g. HDMI cable, base wheels, AC air filter..."
                  value={partsReplaced}
                  onChange={(e) => setPartsReplaced(e.target.value)}
                />
              </div>

              <div className="form-group-3d">
                <label>Total Repair Cost ($ USD)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={maintCost}
                  onChange={(e) => setMaintCost(e.target.value)}
                />
              </div>

              <div className="form-group-3d">
                <label>Next Preventative Service Schedule</label>
                <input 
                  type="date" 
                  value={nextServiceDate}
                  onChange={(e) => setNextServiceDate(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setResolvingIssue(null)}>Cancel</button>
                <button type="submit" className="btn-modal-submit">Resolve Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: BULK QR LABELS PRINT SHEET --- */}
      {showBulkQrModal && (
        <div className="modal-overlay scrollable-modal">
          <div className="bulk-qr-sheet-card animate-slide-up">
            <div className="bulk-modal-head">
              <h3>Bulk Asset Label Print Sheet</h3>
              <div className="bulk-modal-actions no-print">
                <button className="qr-btn" onClick={() => window.print()}>
                  <Printer size={14} /> Print Sheet
                </button>
                <button className="btn-modal-cancel" onClick={() => setShowBulkQrModal(false)}>Close</button>
              </div>
            </div>

            <p className="sheet-desc no-print">A print-ready label sheet. Ideal for physical labeling on computers, AC units, furniture, or plumbing pipes.</p>

            <div className="printable-qr-sheet-grid">
              {assets.filter(a => selectedAssetIds.includes(a.id)).map(asset => (
                <div key={asset.id} className="print-label-sticker bulk-sticker">
                  <div className="sticker-head">MaintainIQ Asset Label</div>
                  <div className="sticker-body">
                    <div className="sticker-qr">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(asset.qr_url || window.location.origin + '/asset/' + asset.asset_code)}`} 
                        alt="QR ID" 
                      />
                    </div>
                    <div className="sticker-info">
                      <p className="st-name">{asset.name}</p>
                      <p className="st-code">CODE: {asset.asset_code}</p>
                      <p className="st-loc">LOC: {asset.location}</p>
                      <p className="st-desc">Scan to report breakdown</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;