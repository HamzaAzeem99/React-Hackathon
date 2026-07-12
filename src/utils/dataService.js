import { supabase } from './supabase';
import { storage } from './storage';

// Unified Service to manage both Supabase and LocalStorage sync (Track A + Track C Compliance)

export const dataService = {
  // --- ASSET MANAGEMENT ---
  getAssets: async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Sync local storage with new assets from Supabase if any
      if (data && data.length > 0) {
        const localAssets = storage.getAssets();
        // Merge assets
        const merged = [...localAssets];
        data.forEach(dbAsset => {
          const existsIdx = merged.findIndex(la => la.asset_code.toUpperCase().trim() === dbAsset.asset_code.toUpperCase().trim());
          if (existsIdx >= 0) {
            merged[existsIdx] = { ...merged[existsIdx], ...dbAsset };
          } else {
            merged.push(dbAsset);
          }
        });
        localStorage.setItem("maintainiq_assets", JSON.stringify(merged));
        return merged;
      }
      
      return storage.getAssets();
    } catch (err) {
      console.warn("Supabase assets query failed, falling back to LocalStorage:", err.message);
      return storage.getAssets();
    }
  },

  getAssetByCode: async (code) => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('asset_code', code.toUpperCase().trim())
        .single();
        
      if (error) throw error;
      if (data) return data;
      
      return storage.getAssetByCode(code);
    } catch (err) {
      console.warn("Supabase asset fetch failed, falling back to LocalStorage:", err.message);
      return storage.getAssetByCode(code);
    }
  },

  getAssetById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (data) return data;
      
      return storage.getAssetById(id);
    } catch (err) {
      console.warn("Supabase asset fetch by id failed, falling back to LocalStorage:", err.message);
      return storage.getAssetById(id);
    }
  },

  saveAsset: async (assetData) => {
    // 1. Validate in storage first (handles duplicate code rejection immediately)
    const savedLocal = storage.saveAsset(assetData);

    try {
      // 2. Attempt to save in Supabase
      const { data, error } = await supabase
        .from('assets')
        .insert([
          {
            asset_code: assetData.asset_code.toUpperCase().trim(),
            name: assetData.name.trim(),
            category: assetData.category,
            location: assetData.location.trim(),
            status: assetData.status || 'Operational',
            qr_url: assetData.qr_url
          }
        ])
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Sync local ID with Supabase generated UUID
        savedLocal.id = data[0].id;
        storage.saveAsset(savedLocal);
        return data[0];
      }
    } catch (err) {
      console.warn("Supabase asset save failed (using local database state):", err.message);
    }
    
    return savedLocal;
  },

  updateAssetStatus: async (assetCode, status) => {
    storage.updateAssetStatus(assetCode, status);
    
    try {
      const { error } = await supabase
        .from('assets')
        .update({ status })
        .eq('asset_code', assetCode.toUpperCase().trim());
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase asset status update failed:", err.message);
    }
  },

  deleteAsset: async (assetId) => {
    const deleted = storage.deleteAsset(assetId);
    try {
      const { error } = await supabase.from('assets').delete().eq('id', assetId);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase asset delete failed:", err.message);
    }
    return deleted;
  },

  getIssueByNumber: async (ticketNumber) => {
    const issues = storage.getIssues();
    return issues.find(i => i.issue_number.toUpperCase() === ticketNumber.toUpperCase().trim()) || null;
  },

  // --- ISSUE MANAGEMENT ---
  getIssues: async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const localIssues = storage.getIssues();
        const merged = [...localIssues];
        data.forEach(dbIssue => {
          const existsIdx = merged.findIndex(li => li.issue_number === dbIssue.issue_number);
          if (existsIdx >= 0) {
            merged[existsIdx] = { ...merged[existsIdx], ...dbIssue };
          } else {
            merged.push(dbIssue);
          }
        });
        localStorage.setItem("maintainiq_issues", JSON.stringify(merged));
        return merged;
      }
      
      return storage.getIssues();
    } catch (err) {
      console.warn("Supabase issues query failed, falling back to LocalStorage:", err.message);
      return storage.getIssues();
    }
  },

  getIssueById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (data) return data;
      
      return storage.getIssueById(id);
    } catch (err) {
      console.warn("Supabase issue fetch failed, falling back to LocalStorage:", err.message);
      return storage.getIssueById(id);
    }
  },

  saveIssue: async (issueData) => {
    // Save locally first
    const savedLocal = storage.saveIssue(issueData);
    
    try {
      // Attempt to save in Supabase
      const { data, error } = await supabase
        .from('issues')
        .insert([
          {
            issue_number: issueData.issue_number,
            asset_name: issueData.asset_name_code || issueData.asset_name,
            asset_id: issueData.asset_id || null,
            title: issueData.title,
            description: issueData.description,
            category: issueData.category,
            priority: issueData.priority,
            status: issueData.status || 'Reported',
            is_ai_triage: issueData.is_ai_triage ?? true
          }
        ])
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        savedLocal.id = data[0].id;
        storage.saveIssue(savedLocal);
        return data[0];
      }
    } catch (err) {
      console.warn("Supabase issue save failed (saved locally):", err.message);
    }

    return savedLocal;
  },

  // --- HISTORY & WORKFLOW TIMELINE ---
  getHistory: async (assetCode = null) => {
    // Timeline is local and synced dynamically
    return storage.getHistory(assetCode);
  },

  addHistory: async (assetCode, actor, action, details) => {
    return storage.addHistory(assetCode, actor, action, details);
  },

  resetData: () => {
    storage.resetData();
  }
};
