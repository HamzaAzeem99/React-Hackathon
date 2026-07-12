import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { dataService } from '../utils/dataService';
import { sanitizePublicIssue } from '../utils/permissions';
import { ArrowLeft, Search, Sun, Moon, HelpCircle, Clock, CheckCircle } from 'lucide-react';
import './ReportIssue.css';

function TrackIssue({ darkMode, toggleTheme }) {
  const { ticketNumber } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lookupTicket, setLookupTicket] = useState(ticketNumber || '');
  const [lookupEmail, setLookupEmail] = useState(searchParams.get('email') || '');

  useEffect(() => {
    async function loadIssue() {
      if (!ticketNumber) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const issues = await dataService.getIssues();
        const found = issues.find(
          (i) => i.issue_number.toUpperCase() === ticketNumber.toUpperCase().trim()
        );
        if (!found) {
          setNotFound(true);
        } else {
          const email = searchParams.get('email');
          if (email && found.reported_by && !found.reported_by.toLowerCase().includes(email.toLowerCase())) {
            setNotFound(true);
          } else {
            setIssue(sanitizePublicIssue(found));
          }
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadIssue();
  }, [ticketNumber, searchParams]);

  const handleLookup = (e) => {
    e.preventDefault();
    if (!lookupTicket.trim() || !lookupEmail.trim()) return;
    navigate(`/track-issue/${lookupTicket.trim()}?email=${encodeURIComponent(lookupEmail.trim())}`);
  };

  const statusIcon = (status) => {
    if (status === 'Resolved') return <CheckCircle size={18} className="text-green" />;
    return <Clock size={18} />;
  };

  if (!ticketNumber) {
    return (
      <div className={`report-issue-container ${darkMode ? 'dark-theme' : 'light-theme'}`}>
        <header className="report-mini-header">
          <button className="btn-back" onClick={() => navigate('/asset/PROJ-01')}>
            <ArrowLeft size={16} /> Back
          </button>
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>
        <div className="report-issue-card">
          <h2>Track Your Issue</h2>
          <p>Enter your ticket number and email to view the status of your reported issue.</p>
          <form onSubmit={handleLookup} className="normal-report-form">
            <div className="form-group-3d">
              <label>Ticket Number</label>
              <input
                type="text"
                placeholder="e.g. TKT-1234"
                value={lookupTicket}
                onChange={(e) => setLookupTicket(e.target.value)}
                required
              />
            </div>
            <div className="form-group-3d">
              <label>Reporter Email</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-submit-main">
              <Search size={16} /> Look Up Ticket
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="report-issue-loading">
        <div className="spinner-green"></div>
        <p>Looking up ticket status...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className={`report-issue-container ${darkMode ? 'dark-theme' : 'light-theme'}`}>
        <div className="report-issue-error">
          <HelpCircle size={64} className="error-icon" />
          <h2>Ticket Not Found</h2>
          <p>No ticket matches that number and email combination.</p>
          <button className="btn-secondary" onClick={() => navigate('/track-issue')}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`report-issue-container ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <header className="report-mini-header">
        <button className="btn-back" onClick={() => navigate(`/asset/${issue.asset_name_code}`)}>
          <ArrowLeft size={16} /> Back to Asset
        </button>
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>
      <div className="report-issue-card">
        <span className="asset-code-badge">{issue.issue_number}</span>
        <h2>{issue.title}</h2>
        <p>Asset: <strong>{issue.asset_name}</strong></p>
        <div className="info-item-3d" style={{ marginTop: '1rem' }}>
          <span className="info-label">Current Status</span>
          <span className="info-value-badge status-inspect">
            {statusIcon(issue.status)} {issue.status}
          </span>
        </div>
        <div className="info-item-3d" style={{ marginTop: '0.75rem' }}>
          <span className="info-label">Priority</span>
          <span className="info-value">{issue.priority}</span>
        </div>
        <div className="info-item-3d" style={{ marginTop: '0.75rem' }}>
          <span className="info-label">Reported</span>
          <span className="info-value">{new Date(issue.created_at).toLocaleString()}</span>
        </div>
        <p className="helper-hint" style={{ marginTop: '1.5rem' }}>
          Technician notes, costs, and internal details are not shown on this public tracking page.
        </p>
      </div>
    </div>
  );
}

export default TrackIssue;
