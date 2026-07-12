import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataService } from '../utils/dataService';
import { filterPublicHistory } from '../utils/permissions';
import { 
  ShieldCheck, 
  MapPin, 
  AlertCircle, 
  Wrench, 
  CheckCircle, 
  HelpCircle, 
  Activity, 
  Calendar,
  Clock,
  Sun,
  Moon,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import './PublicAsset.css';

function PublicAsset({ darkMode, toggleTheme }) {
  const { assetCode } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function getPublicAssetInfo() {
      try {
        setLoading(true);
        // Find asset by code
        const codeClean = assetCode.toUpperCase().trim();
        const foundAsset = await dataService.getAssetByCode(codeClean);

        if (!foundAsset) {
          setNotFound(true);
        } else {
          setAsset(foundAsset);
          const timeline = await dataService.getHistory(foundAsset.asset_code);
          setHistory(filterPublicHistory(timeline));
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    getPublicAssetInfo();
  }, [assetCode]);

  if (loading) {
    return (
      <div className="public-loading">
        <div className="spinner-green"></div>
        <p>📡 Scanning digital corporate registry tag...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="public-container-green error-bg">
        <div className="public-card-error-3d animate-slide-up">
          <HelpCircle size={64} className="error-icon-glow" />
          <h2>404 - Identity Missing</h2>
          <p>This QR barcode does not match any registered records in our centralized system database.</p>
          <button className="btn-error-home" onClick={() => navigate('/asset/PROJ-01')}>Browse Sample Asset</button>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    switch(status) {
      case 'Operational': 
        return { icon: <CheckCircle size={16} />, className: 'status-op', text: 'Operational & Secure' };
      case 'Issue Reported': 
        return { icon: <AlertCircle size={16} />, className: 'status-reported', text: 'Breakdown Reported' };
      case 'Under Inspection': 
        return { icon: <Activity size={16} />, className: 'status-inspect', text: 'Under Inspection' };
      case 'Under Maintenance': 
        return { icon: <Wrench size={16} />, className: 'status-maint', text: 'Maintenance In Progress' };
      case 'Out of Service': 
        return { icon: <AlertTriangle size={16} />, className: 'status-oos', text: 'Out of Service' };
      case 'Retired': 
        return { icon: <AlertTriangle size={16} />, className: 'status-retired', text: 'Retired Asset' };
      default: 
        return { icon: <Activity size={16} />, className: 'status-default', text: status };
    }
  };

  const statusConfig = getStatusConfig(asset.status);

  return (
    <div className={`public-container-green ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      
      {/* Header theme toggle */}
      <div className="public-top-bar">
        <span className="corporate-title">MaintainIQ Portal</span>
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="public-card-green-3d animate-slide-up">
        
        {/* Safe Top Verified Badge */}
        <div className="safe-identity-badge">
          <ShieldCheck size={16} className="shield-icon" /> 
          <span>Corporate Assets Register Profile</span>
        </div>

        {/* Retired Warning Label (PDF Rule 4.3) */}
        {asset.status === 'Retired' && (
          <div className="retired-banner animate-pulse">
            <AlertOctagonIcon />
            <span>CRITICAL WARNING: This asset has been permanently retired and taken out of active service operations.</span>
          </div>
        )}

        {/* Info Head */}
        <div className="public-asset-header">
          <span className="public-asset-code">CODE: {asset.asset_code}</span>
          <h2>{asset.name}</h2>
          <p className="public-category"><FolderOpen size={14} style={{ marginRight: '4px' }} /> Category: <strong>{asset.category}</strong></p>
        </div>

        {/* Info Grid */}
        <div className="public-info-grid-3d">
          <div className="info-item-3d">
            <span className="info-label"><MapPin size={16} /> Location Room</span>
            <span className="info-value">{asset.location}</span>
          </div>

          <div className="info-item-3d">
            <span className="info-label"><Activity size={16} /> Current Status</span>
            <span className={`info-value-badge ${statusConfig.className}`}>
              {statusConfig.icon} {statusConfig.text}
            </span>
          </div>
        </div>

        {asset.last_service && (
          <div className="public-service-dates animate-fade-in">
            <div className="date-box">
              <Calendar size={14} />
              <span>Last serviced: <strong>{asset.last_service}</strong></span>
            </div>
            <div className="date-box next-due">
              <Calendar size={14} />
              <span>Next service: <strong>{asset.next_service}</strong></span>
            </div>
          </div>
        )}

        {/* Main Action Trigger for Issue Reporting & AI Triage */}
        {asset.status !== 'Retired' && (
          <div className="public-action-zone">
            <h3>Spot an Issue with this Asset?</h3>
            <p>Report the breakdown or failure instantly. Our System AI will automatically triage the problem details.</p>
            
            <button 
              className="btn-report-now-green-3d"
              onClick={() => navigate(`/report-issue/${asset.id}`)}
              disabled={asset.status === 'Out of Service'}
            >
              ⚠️ Report Breakdown / Issue
            </button>

            <button
              className="btn-report-now-green-3d"
              style={{ marginTop: '0.75rem', background: 'transparent', border: '2px solid #10b981', color: 'inherit' }}
              onClick={() => navigate('/track-issue')}
            >
              Track an Existing Issue
            </button>
          </div>
        )}

        {/* SAFE PUBLIC SERVICE HISTORY */}
        <div className="public-history-section">
          <h4><Clock size={16} /> Safe Public Timeline logs</h4>
          <p className="public-history-sub">Exposes basic milestones. Detailed technical summaries and service costs are restricted.</p>
          
          {history.length === 0 ? (
            <p className="public-empty-history">No milestones logged for this asset.</p>
          ) : (
            <div className="public-timeline">
              {history.map((event, idx) => (
                <div key={event.id || idx} className="public-timeline-item">
                  <div className="node"></div>
                  <div className="content">
                    <span className="time">{new Date(event.created_at).toLocaleDateString()}</span>
                    <h5 className="action">{event.action}</h5>
                    <p className="details">{event.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Simple Internal Icon Component
function AlertOctagonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default PublicAsset;