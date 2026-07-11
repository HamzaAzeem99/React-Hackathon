import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataService } from '../utils/dataService';
import { 
  ArrowLeft, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  Info,
  Sun,
  Moon,
  HelpCircle
} from 'lucide-react';
import './ReportIssue.css';

function ReportIssue({ darkMode, toggleTheme, setGlobalLoading }) {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [rawComplaint, setRawComplaint] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [priority, setPriority] = useState('Medium');

  // AI Triage State
  const [isTriageLoading, setIsTriageLoading] = useState(false);
  const [triageSteps, setTriageSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [showTriageEditor, setShowTriageEditor] = useState(false);

  // Final editable fields after AI Triage
  const [finalTitle, setFinalTitle] = useState('');
  const [finalDescription, setFinalDescription] = useState('');
  const [finalCategory, setFinalCategory] = useState('');
  const [finalPriority, setFinalPriority] = useState('');
  const [finalCauses, setFinalCauses] = useState('');
  const [finalChecks, setFinalChecks] = useState('');
  const [patternWarning, setPatternWarning] = useState('');
  const [wasAiSuggested, setWasAiSuggested] = useState(false);
  const [isUserEdited, setIsUserEdited] = useState(false);

  useEffect(() => {
    async function loadAsset() {
      try {
        setLoading(true);
        // Find asset by code or ID
        const assets = await dataService.getAssets();
        const found = assets.find(a => a.id === assetId || a.asset_code === assetId);
        if (found) {
          setAsset(found);
          setCategory(found.category);
          
          // Check for recurring pattern warning based on history
          const history = await dataService.getHistory(found.asset_code);
          const issueReports = history.filter(h => h.action.toLowerCase().includes('issue') || h.action.toLowerCase().includes('reported'));
          if (issueReports.length > 0) {
            setPatternWarning(`⚠️ Recurring Pattern: This asset has had ${issueReports.length} previous issue(s) reported. A thorough diagnostic inspection is highly recommended.`);
          }
        }
      } catch (err) {
        console.error("Error loading asset:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAsset();
  }, [assetId]);

  const simulateAiTriage = () => {
    if (!rawComplaint.trim()) return;

    setIsTriageLoading(true);
    setShowTriageEditor(false);
    setTriageSteps([
      "📡 Establishing secure link with MaintainIQ AI Triage service...",
      "🔍 Inspecting asset registry (Class: " + asset.category + ", Location: " + asset.location + ")...",
      "📚 Analyzing asset service history and recurring failure patterns...",
      "🧠 Performing semantic analysis of natural language complaint...",
      "⚠️ Scanning for critical safety hazards and industrial warnings...",
      "✨ Generating professional title, diagnostic steps, and safety checks..."
    ]);
    setCurrentStepIndex(0);
  };

  useEffect(() => {
    if (currentStepIndex >= 0 && currentStepIndex < triageSteps.length) {
      const timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else if (currentStepIndex === triageSteps.length) {
      // AI triaging completed, generate the suggestion content
      const text = rawComplaint.toLowerCase();
      let suggestions = {
        title: "Asset Issue Reported",
        category: category,
        priority: "Medium",
        causes: "Component failure or wear and tear.",
        checks: "Contact local maintenance personnel. Do not attempt self-repair."
      };

      if (text.includes("ac") || text.includes("leak") || text.includes("cool") || text.includes("water") || text.includes("noise")) {
        suggestions = {
          title: "Water leakage and reduced cooling",
          category: "HVAC / AC",
          priority: "High",
          causes: "Blocked drain pipe, dirty evaporator coil, frozen condenser coil.",
          checks: "Turn off unit immediately if water is leaking near electrical outlets. Inspect drain line. Check if air filter is clogged."
        };
      } else if (text.includes("projector") || text.includes("display") || text.includes("flicker") || text.includes("hdmi") || text.includes("screen")) {
        suggestions = {
          title: "HDMI display flickering and connection failure",
          category: "Electronics",
          priority: "High",
          causes: "Loose HDMI port contact, faulty HDMI cable, out-of-range source resolution.",
          checks: "DO NOT open the projector casing. Verify source input is active. Test connection with a brand new shielded HDMI cable."
        };
      } else if (text.includes("router") || text.includes("wifi") || text.includes("internet") || text.includes("slow") || text.includes("connection")) {
        suggestions = {
          title: "Wireless connectivity disruption and low bandwidth",
          category: "Electronics",
          priority: "Medium",
          causes: "IP address conflict, wireless channel interference, hardware overheating, outdated firmware.",
          checks: "Do not factory reset without authorization. Perform a power cycle by disconnecting adapter for 30 seconds. Verify WAN status LED."
        };
      } else if (text.includes("chair") || text.includes("broken") || text.includes("wheel") || text.includes("hydraulic") || text.includes("lean")) {
        suggestions = {
          title: "Mechanical unstable base and hydraulic leakage",
          category: "Furniture",
          priority: "Low",
          causes: "Cylinder pressure loss, loose mounting bolts, damaged caster wheel bearings.",
          checks: "Set the chair aside. Do not sit on the chair while it is unstable. Tighten plate screws if tools are available."
        };
      } else {
        // Dynamic generic fallback using keywords
        const firstWords = rawComplaint.split(' ').slice(0, 5).join(' ');
        suggestions = {
          title: `Technical failure: ${firstWords}...`,
          category: category,
          priority: rawComplaint.length > 50 ? "High" : "Medium",
          causes: `Mechanical breakdown or hardware malfunction matching '${firstWords}'.`,
          checks: "Isolate the asset from power if electrical. Label the item 'OUT OF SERVICE' pending technician review."
        };
      }

      setFinalTitle(suggestions.title);
      setFinalDescription(rawComplaint);
      setFinalCategory(suggestions.category);
      setFinalPriority(suggestions.priority);
      setFinalCauses(suggestions.causes);
      setFinalChecks(suggestions.checks);
      setWasAiSuggested(true);

      setIsTriageLoading(false);
      setShowTriageEditor(true);
      setCurrentStepIndex(-1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex, triageSteps]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reporterName.trim() || !rawComplaint.trim()) return;

    setSubmitting(true);
    setGlobalLoading(true);

    const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

    const issueObject = {
      id: "i_" + Math.random().toString(36).substr(2, 9),
      issue_number: ticketNumber,
      asset_id: asset.id,
      asset_name_code: asset.asset_code,
      asset_name: asset.name,
      title: wasAiSuggested ? finalTitle : `Issue with ${asset.name}`,
      description: wasAiSuggested ? finalDescription : rawComplaint,
      category: wasAiSuggested ? finalCategory : category,
      priority: wasAiSuggested ? finalPriority : priority,
      status: 'Reported',
      reported_by: `${reporterName} (${reporterEmail})`,
      is_ai_triage: wasAiSuggested,
      is_edited: isUserEdited,
      possible_causes: wasAiSuggested ? finalCauses : '',
      safety_checks: wasAiSuggested ? finalChecks : '',
      created_at: new Date().toISOString()
    };

    try {
      // 1. Save ticket
      await dataService.saveIssue(issueObject);
      
      // 2. Add history timeline entry
      await dataService.addHistory(
        asset.asset_code,
        reporterName,
        "Issue Reported",
        `Ticket ${ticketNumber}: ${issueObject.title} (Priority: ${issueObject.priority})`
      );

      // 3. Update asset status
      await dataService.updateAssetStatus(asset.asset_code, "Issue Reported");

      setTimeout(() => {
        setSubmitting(false);
        setGlobalLoading(false);
        navigate(`/asset/${asset.asset_code}`);
      }, 1000);

    } catch (err) {
      alert("Submission error: " + err.message);
      setSubmitting(false);
      setGlobalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="report-issue-loading">
        <div className="spinner-green"></div>
        <p>📡 Fetching corporate asset registry profile...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="report-issue-container">
        <div className="report-issue-error">
          <HelpCircle size={64} className="error-icon" />
          <h2>Asset Profile Not Found</h2>
          <p>The asset identifier is invalid or does not exist in the centralized register.</p>
          <button className="btn-secondary" onClick={() => navigate('/login')}>Return to Admin Control</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`report-issue-container ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      
      {/* Mini Header */}
      <header className="report-mini-header">
        <button className="btn-back" onClick={() => navigate(`/asset/${asset.asset_code}`)}>
          <ArrowLeft size={16} /> Exit Form
        </button>
        <div className="theme-toggle-wrapper">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <div className="report-issue-card">
        <div className="report-issue-header">
          <span className="asset-code-badge">{asset.asset_code}</span>
          <h2>Report Break-down / Failure</h2>
          <p>Asset: <strong>{asset.name}</strong> • Location: <strong>{asset.location}</strong></p>
        </div>

        {patternWarning && (
          <div className="warning-box animate-pulse">
            <AlertTriangle size={18} className="warn-icon" />
            <span>{patternWarning}</span>
          </div>
        )}

        {/* AI Triage Loading Animation */}
        {isTriageLoading && (
          <div className="ai-triage-overlay">
            <div className="ai-triage-spinner-box">
              <Sparkles size={36} className="ai-spin-icon" />
              <h3>MaintainIQ AI Triage™ Running</h3>
              <div className="loading-bar-outer">
                <div className="loading-bar-inner" style={{ width: `${(currentStepIndex + 1) * 16.6}%` }}></div>
              </div>
              <p className="step-text animate-fade-in">{triageSteps[currentStepIndex]}</p>
            </div>
          </div>
        )}

        {!showTriageEditor ? (
          <form onSubmit={handleSubmit} className="normal-report-form">
            <div className="form-row-grid">
              <div className="form-group-3d">
                <label>Reporter Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. John Doe"
                  value={reporterName} 
                  onChange={(e) => setReporterName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group-3d">
                <label>Reporter Email</label>
                <input 
                  type="email" 
                  placeholder="name@company.com"
                  value={reporterEmail} 
                  onChange={(e) => setReporterEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="form-group-3d">
              <label>Describe the Breakdown / Symptoms</label>
              <textarea 
                rows="4" 
                placeholder="Describe what is failing, any noises, leaks, error messages, or abnormal behaviors..."
                value={rawComplaint}
                onChange={(e) => setRawComplaint(e.target.value)}
                required
              ></textarea>
              <span className="helper-hint"><Info size={12} /> Explain clearly for a better AI analysis report.</span>
            </div>

            <div className="triage-helper-zone">
              <div className="info-badge">
                <Sparkles size={16} /> Smart AI Triage Enabled
              </div>
              <p>Submit your raw complaint to the AI to auto-generate a technical title, category, priority, possible mechanical/electrical causes, and safe diagnostic checks.</p>
              
              <button 
                type="button" 
                className="btn-ai-triage"
                disabled={!rawComplaint.trim() || !reporterName.trim()}
                onClick={simulateAiTriage}
              >
                <Sparkles size={18} />
                <span>Run Intelligent AI Triage</span>
              </button>
            </div>

            <hr className="divider" />

            <div className="form-row-grid">
              <div className="form-group-3d">
                <label>Manual Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Electronics">🔌 Electronics</option>
                  <option value="Furniture">🪑 Furniture</option>
                  <option value="Plumbing">🚰 Plumbing</option>
                  <option value="HVAC / AC">❄️ HVAC / AC</option>
                  <option value="Other">🛠️ Others</option>
                </select>
              </div>

              <div className="form-group-3d">
                <label>Manual Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="Low">🟢 Low (Routine Maintenance)</option>
                  <option value="Medium">🟡 Medium (Urgent Request)</option>
                  <option value="High">🟠 High (Critical Failure)</option>
                  <option value="Critical">🔴 Critical (Safety Hazard / Out of Service)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-submit-main" disabled={submitting}>
              <span>{submitting ? "Submitting..." : "Submit Maintenance Ticket"}</span>
            </button>
          </form>
        ) : (
          /* AI TRIAGE REVIEW EDITOR SCREEN (PDF Requirement: User reviews/edits/rejects AI Output) */
          <div className="ai-editor-card animate-slide-up">
            <div className="ai-editor-title">
              <Sparkles size={20} className="glow-icon" />
              <h3>AI Suggested Triage - Review & Edit</h3>
            </div>
            <p className="ai-intro-text">Our system AI suggested the following details. You can review, edit, or customize any field before finalizing the ticket submission.</p>

            <form onSubmit={handleSubmit} className="triage-review-form">
              
              <div className="form-group-3d">
                <label className="ai-label">Suggested Technical Title</label>
                <input 
                  type="text" 
                  value={finalTitle} 
                  onChange={(e) => {
                    setFinalTitle(e.target.value);
                    setIsUserEdited(true);
                  }} 
                  required 
                />
              </div>

              <div className="form-row-grid">
                <div className="form-group-3d">
                  <label className="ai-label">Suggested Category</label>
                  <select 
                    value={finalCategory} 
                    onChange={(e) => {
                      setFinalCategory(e.target.value);
                      setIsUserEdited(true);
                    }}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="HVAC / AC">HVAC / AC</option>
                    <option value="Other">Others</option>
                  </select>
                </div>

                <div className="form-group-3d">
                  <label className="ai-label">Suggested Priority</label>
                  <select 
                    value={finalPriority} 
                    onChange={(e) => {
                      setFinalPriority(e.target.value);
                      setIsUserEdited(true);
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="form-group-3d">
                <label className="ai-label">AI Suspected Causes</label>
                <textarea 
                  rows="3" 
                  value={finalCauses} 
                  onChange={(e) => {
                    setFinalCauses(e.target.value);
                    setIsUserEdited(true);
                  }}
                ></textarea>
              </div>

              <div className="form-group-3d">
                <label className="ai-label-safety">⚠️ Recommended Safety Checks</label>
                <textarea 
                  rows="3" 
                  value={finalChecks} 
                  onChange={(e) => {
                    setFinalChecks(e.target.value);
                    setIsUserEdited(true);
                  }}
                ></textarea>
              </div>

              <div className="ai-editor-actions">
                <button 
                  type="button" 
                  className="btn-reject-triage"
                  onClick={() => {
                    setShowTriageEditor(false);
                    setWasAiSuggested(false);
                    setIsUserEdited(false);
                  }}
                >
                  Reject AI Suggestions
                </button>

                <button type="submit" className="btn-approve-triage" disabled={submitting}>
                  <Check size={18} />
                  <span>{submitting ? "Submitting..." : "Confirm & Submit Ticket"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

export default ReportIssue;
