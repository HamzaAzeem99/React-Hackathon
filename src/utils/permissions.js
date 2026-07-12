export const ROLES = {
  ADMIN: 'Admin',
  TECHNICIAN: 'Technician',
};

export const PERMISSIONS = {
  DASHBOARD: 'dashboard',
  CREATE_ASSETS: 'create_assets',
  EDIT_ASSETS: 'edit_assets',
  DELETE_ASSETS: 'delete_assets',
  VIEW_ALL_ASSETS: 'view_all_assets',
  VIEW_ALL_ISSUES: 'view_all_issues',
  VIEW_ASSIGNED_ISSUES: 'view_assigned_issues',
  ASSIGN_TECHNICIAN: 'assign_technician',
  SCHEDULE_MAINTENANCE: 'schedule_maintenance',
  SEARCH: 'search',
  FILTERS: 'filters',
  ANALYTICS: 'analytics',
  QR_GENERATION: 'qr_generation',
  VIEW_HISTORY: 'view_history',
  ORG_SETTINGS: 'org_settings',
  START_INSPECTION: 'start_inspection',
  UPDATE_STATUS: 'update_status',
  ADD_MAINTENANCE_NOTES: 'add_maintenance_notes',
  RESOLVE_ISSUE: 'resolve_issue',
  REOPEN_TICKET: 'reopen_ticket',
  RESET_DATA: 'reset_data',
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.CREATE_ASSETS,
    PERMISSIONS.EDIT_ASSETS,
    PERMISSIONS.DELETE_ASSETS,
    PERMISSIONS.VIEW_ALL_ASSETS,
    PERMISSIONS.VIEW_ALL_ISSUES,
    PERMISSIONS.ASSIGN_TECHNICIAN,
    PERMISSIONS.SCHEDULE_MAINTENANCE,
    PERMISSIONS.SEARCH,
    PERMISSIONS.FILTERS,
    PERMISSIONS.ANALYTICS,
    PERMISSIONS.QR_GENERATION,
    PERMISSIONS.VIEW_HISTORY,
    PERMISSIONS.ORG_SETTINGS,
    PERMISSIONS.REOPEN_TICKET,
    PERMISSIONS.RESET_DATA,
  ],
  [ROLES.TECHNICIAN]: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.VIEW_ASSIGNED_ISSUES,
    PERMISSIONS.SEARCH,
    PERMISSIONS.FILTERS,
    PERMISSIONS.START_INSPECTION,
    PERMISSIONS.UPDATE_STATUS,
    PERMISSIONS.ADD_MAINTENANCE_NOTES,
    PERMISSIONS.RESOLVE_ISSUE,
  ],
};

export function getUserRole(user) {
  return user?.role || null;
}

export function canAccessDashboard(role) {
  return role === ROLES.ADMIN || role === ROLES.TECHNICIAN;
}

export function hasPermission(role, permission) {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isIssueAssignedToUser(issue, user) {
  if (!issue?.assigned_to || !user?.full_name) return false;
  const assigned = issue.assigned_to.trim();
  const name = user.full_name.trim();
  return assigned === name || assigned.startsWith(name + ' ') || assigned.startsWith(name + '(');
}

const PUBLIC_HISTORY_ACTIONS = new Set([
  'Asset Registered',
  'Issue Reported',
]);

export function filterPublicHistory(timeline) {
  return timeline
    .filter((event) => PUBLIC_HISTORY_ACTIONS.has(event.action))
    .map((event) => ({
      ...event,
      actor: event.action === 'Issue Reported' ? 'Reporter' : 'System',
      details: event.action === 'Issue Reported'
        ? event.details.split('(')[0].trim()
        : 'Asset registered in corporate system.',
    }));
}

export function sanitizePublicIssue(issue) {
  if (!issue) return null;
  return {
    issue_number: issue.issue_number,
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    created_at: issue.created_at,
    asset_name: issue.asset_name,
    asset_name_code: issue.asset_name_code || issue.asset_code,
  };
}
