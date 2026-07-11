import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../utils/dataService';
import { Layers, MapPin, Tag, PlusCircle, QrCode, ArrowLeft, CheckCircle, Sun, Moon } from 'lucide-react';
import './RegisterAsset.css';

function RegisterAsset({ session, darkMode, toggleTheme, setGlobalLoading }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [location, setLocation] = useState('');
  const [assetCode, setAssetCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredAsset, setRegisteredAsset] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setRegisteredAsset(null);
    setGlobalLoading(true);

    const codeUpper = assetCode.toUpperCase().trim();
    const generatedQrUrl = `${window.location.origin}/asset/${codeUpper}`;

    const newAsset = {
      id: "a_" + Math.random().toString(36).substr(2, 9),
      asset_code: codeUpper,
      name: name.trim(),
      category,
      location: location.trim(),
      status: 'Operational',
      qr_url: generatedQrUrl
    };

    try {
      const saved = await dataService.saveAsset(newAsset);
      
      // Log registered in service history timeline
      await dataService.addHistory(
        codeUpper,
        session.user.full_name || 'Admin',
        'Asset Registered',
        `Asset added: ${name.trim()} in ${location.trim()}. Initial status: Operational.`
      );

      setRegisteredAsset(saved);
      // Clear Form fields
      setName('');
      setLocation('');
      setAssetCode('');
    } catch (error) {
      setErrorMsg(`❌ Registration Error: ${error.message || 'Asset Code already exists!'}`);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  return (
    <div className={`register-container-green ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <div className="register-card-green-3d animate-slide-up">
        
        {/* Back to Dashboard & Theme Button */}
        <div className="register-nav-actions">
          <button className="btn-back-green" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="register-header-green">
          <h2>📦 Register Asset Profile <span className="vip-tag-green">VIP</span></h2>
          <p>Create digital system entries and auto-generate QR asset tags</p>
        </div>

        <div className="register-split-layout">
          {/* Left Side: Form */}
          <form onSubmit={handleSubmit} className="register-form-green">
            <div className="input-group-green-3d">
              <label><Tag size={16} /> Unique Asset Code (e.g., COMP-404)</label>
              <input 
                type="text" 
                placeholder="Enter unique code" 
                value={assetCode} 
                onChange={(e) => setAssetCode(e.target.value)} 
                required 
              />
            </div>

            <div className="input-group-green-3d">
              <label><Layers size={16} /> Asset Name / Description</label>
              <input 
                type="text" 
                placeholder="e.g., Classroom Projector Sony" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="input-group-green-3d">
              <label><Layers size={16} /> Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Electronics">🔌 Electronics</option>
                <option value="Furniture">🪑 Furniture</option>
                <option value="Plumbing">🚰 Plumbing</option>
                <option value="HVAC / AC">❄️ HVAC / AC</option>
                <option value="Other">🛠️ Others</option>
              </select>
            </div>

            <div className="input-group-green-3d">
              <label><MapPin size={16} /> Room Location</label>
              <input 
                type="text" 
                placeholder="e.g., Lab 3, 2nd Floor" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="btn-submit-green-3d" disabled={loading}>
              <PlusCircle size={18} />
              <span>{loading ? '⏳ Registering...' : 'Register & Generate QR'}</span>
            </button>

            {errorMsg && <div className="error-message-green-3d">{errorMsg}</div>}
          </form>

          {/* Right Side: Dynamic QR 3D Output Panel */}
          <div className="qr-output-panel-3d">
            {registeredAsset ? (
              <div className="qr-success-box animate-fade-in">
                <div className="success-icon-badge"><CheckCircle size={24} /></div>
                <h3>Asset Registered Successfully!</h3>
                
                {/* Print sticker preview */}
                <div className="print-label-sticker" id="print-label-sticker-id">
                  <div className="sticker-head">MaintainIQ Asset Label</div>
                  <div className="sticker-body">
                    <div className="sticker-qr">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(registeredAsset.qr_url)}`} 
                        alt="Asset QR Code" 
                      />
                    </div>
                    <div className="sticker-info">
                      <p className="st-name">{registeredAsset.name}</p>
                      <p className="st-code">CODE: {registeredAsset.asset_code}</p>
                      <p className="st-loc">LOC: {registeredAsset.location}</p>
                      <p className="st-desc">Scan to report breakdowns instantly</p>
                    </div>
                  </div>
                </div>
                
                <p className="qr-instruction">Test scan with phone to report issues.</p>
                <div className="success-actions">
                  <button className="btn-print-3d" onClick={() => window.print()}>
                    🖨️ Print Label Sticker
                  </button>
                  <button className="btn-test-redirect" onClick={() => navigate(`/asset/${registeredAsset.asset_code}`)}>
                    🔍 View Profile
                  </button>
                </div>
              </div>
            ) : (
              <div className="qr-placeholder-box">
                <QrCode size={64} className="placeholder-qr-icon" />
                <p>Fill the asset details and click submit to generate the digital live QR label identity.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default RegisterAsset;