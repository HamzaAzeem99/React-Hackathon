// Storage Utility for offline fallback and local state persistence (Track C / VIP offline capability)

const DEFAULT_ASSETS = [
  {
    id: "eef531f9-9efc-4afb-9e1b-943606dc10b9",
    asset_code: "PROJ-01",
    name: "Classroom Projector 01",
    category: "Electronics",
    location: "Classroom 101, 1st Floor",
    status: "Operational",
    qr_url: "",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  },
  {
    id: "a0928bb8-12cd-4be8-8888-c7a606d11b22",
    asset_code: "AC-02",
    name: "Server Room AC 02",
    category: "HVAC / AC",
    location: "Server Room, Basement",
    status: "Operational",
    qr_url: "",
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "b2123cc8-23ef-4be9-9999-d7b606d22c33",
    asset_code: "WD-03",
    name: "Lab Water Dispenser",
    category: "Plumbing",
    location: "Chemistry Lab, 2nd Floor",
    status: "Operational",
    qr_url: "",
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "c4321dd9-34ab-4cf0-aaaa-e8c606d33d44",
    asset_code: "ROUT-04",
    name: "Library Router",
    category: "Electronics",
    location: "Library Main Hall",
    status: "Operational",
    qr_url: "",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "d5432ee0-45bc-4cf1-bbbb-f9d606d44e55",
    asset_code: "CHR-05",
    name: "Executive Desk Chair",
    category: "Furniture",
    location: "Conference Room B",
    status: "Operational",
    qr_url: "",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_HISTORY = [
  {
    id: "h1",
    asset_code: "PROJ-01",
    actor: "System Administrator",
    action: "Asset Registered",
    details: "Projector added to system register.",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "h2",
    asset_code: "PROJ-01",
    actor: "Admin (System)",
    action: "Maintenance Completed",
    details: "Routine checkup and filter cleaning completed successfully.",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "h3",
    asset_code: "AC-02",
    actor: "System Administrator",
    action: "Asset Registered",
    details: "Server room cooling system added to inventory.",
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "h4",
    asset_code: "WD-03",
    actor: "System Administrator",
    action: "Asset Registered",
    details: "Water Dispenser unit registered.",
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "h5",
    asset_code: "ROUT-04",
    actor: "System Administrator",
    action: "Asset Registered",
    details: "Dual-band corporate router registered.",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "h6",
    asset_code: "CHR-05",
    actor: "System Administrator",
    action: "Asset Registered",
    details: "Premium mesh ergonomic chair registered.",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const initStorage = () => {
  if (!localStorage.getItem("maintainiq_assets")) {
    // Generate QR urls dynamically for default list based on current window host
    const origin = window.location.origin;
    const assetsWithQr = DEFAULT_ASSETS.map(asset => ({
      ...asset,
      qr_url: `${origin}/asset/${asset.asset_code}`
    }));
    localStorage.setItem("maintainiq_assets", JSON.stringify(assetsWithQr));
  }
  if (!localStorage.getItem("maintainiq_issues")) {
    localStorage.setItem("maintainiq_issues", JSON.stringify([]));
  }
  if (!localStorage.getItem("maintainiq_history")) {
    localStorage.setItem("maintainiq_history", JSON.stringify(DEFAULT_HISTORY));
  }
};

export const storage = {
  getAssets: () => {
    initStorage();
    return JSON.parse(localStorage.getItem("maintainiq_assets"));
  },

  getAssetByCode: (code) => {
    const assets = storage.getAssets();
    return assets.find(a => a.asset_code.toUpperCase().trim() === code.toUpperCase().trim()) || null;
  },

  getAssetById: (id) => {
    const assets = storage.getAssets();
    return assets.find(a => a.id === id) || null;
  },

  saveAsset: (asset) => {
    const assets = storage.getAssets();
    
    // Check duplicate code
    const duplicate = assets.find(a => a.asset_code.toUpperCase().trim() === asset.asset_code.toUpperCase().trim() && a.id !== asset.id);
    if (duplicate) {
      throw new Error("An asset with this unique code already exists!");
    }

    const index = assets.findIndex(a => a.id === asset.id);
    if (index >= 0) {
      assets[index] = asset;
    } else {
      assets.push(asset);
    }
    localStorage.setItem("maintainiq_assets", JSON.stringify(assets));
    
    // Record history
    storage.addHistory(asset.asset_code, "System", index >= 0 ? "Asset Updated" : "Asset Registered", `Asset name: ${asset.name}, category: ${asset.category}, location: ${asset.location}`);
    
    return asset;
  },

  updateAssetStatus: (assetCode, status) => {
    const assets = storage.getAssets();
    const asset = assets.find(a => a.asset_code.toUpperCase().trim() === assetCode.toUpperCase().trim());
    if (asset) {
      asset.status = status;
      localStorage.setItem("maintainiq_assets", JSON.stringify(assets));
    }
  },

  deleteAsset: (assetId) => {
    const assets = storage.getAssets();
    const asset = assets.find(a => a.id === assetId);
    if (!asset) throw new Error('Asset not found');
    const filtered = assets.filter(a => a.id !== assetId);
    localStorage.setItem("maintainiq_assets", JSON.stringify(filtered));
    return asset;
  },

  getIssues: () => {
    initStorage();
    return JSON.parse(localStorage.getItem("maintainiq_issues"));
  },

  getIssueById: (id) => {
    const issues = storage.getIssues();
    return issues.find(i => i.id === id) || null;
  },

  saveIssue: (issue) => {
    const issues = storage.getIssues();
    const index = issues.findIndex(i => i.id === issue.id);
    if (index >= 0) {
      issues[index] = issue;
    } else {
      issues.push(issue);
    }
    localStorage.setItem("maintainiq_issues", JSON.stringify(issues));
    
    // Update asset status based on issue events
    if (issue.status === "Reported") {
      storage.updateAssetStatus(issue.asset_name_code || issue.asset_code, "Issue Reported");
    }
    
    return issue;
  },

  getHistory: (assetCode = null) => {
    initStorage();
    const history = JSON.parse(localStorage.getItem("maintainiq_history"));
    if (assetCode) {
      return history.filter(h => h.asset_code.toUpperCase().trim() === assetCode.toUpperCase().trim())
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  addHistory: (assetCode, actor, action, details) => {
    initStorage();
    const history = JSON.parse(localStorage.getItem("maintainiq_history"));
    const newEvent = {
      id: "h_" + Math.random().toString(36).substr(2, 9),
      asset_code: assetCode.toUpperCase().trim(),
      actor,
      action,
      details,
      created_at: new Date().toISOString()
    };
    history.push(newEvent);
    localStorage.setItem("maintainiq_history", JSON.stringify(history));
    return newEvent;
  },

  resetData: () => {
    localStorage.removeItem("maintainiq_assets");
    localStorage.removeItem("maintainiq_issues");
    localStorage.removeItem("maintainiq_history");
    initStorage();
  }
};
