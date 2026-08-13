// Single source of truth for every permission key in the system.
// Roles store a JSON array of these keys. Add new keys here as new
// modules (Clients, Vehicles, Debts, ...) come online — nothing else
// needs to change to support a new permission.

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",

  EMPLOYEES_VIEW: "employees.view",
  EMPLOYEES_MANAGE: "employees.manage", // create/edit/delete/block/roles

  BRANCHES_VIEW: "branches.view",
  BRANCHES_MANAGE: "branches.manage",

  CLIENTS_VIEW: "clients.view",
  CLIENTS_MANAGE: "clients.manage",

  VEHICLES_VIEW: "vehicles.view",
  VEHICLES_MANAGE: "vehicles.manage",

  MAINTENANCE_VIEW: "maintenance.view",
  MAINTENANCE_MANAGE: "maintenance.manage",

  DEBTS_VIEW: "debts.view",
  DEBTS_MANAGE: "debts.manage",

  AUDIT_LOG_VIEW: "audit_log.view",
};

export const ALL_PERMISSION_KEYS = Object.values(PERMISSIONS);

// Default permission sets used by the seed script.
export const DEFAULT_ADMIN_PERMISSIONS = ALL_PERMISSION_KEYS;

export const DEFAULT_EMPLOYEE_PERMISSIONS = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.CLIENTS_VIEW,
  PERMISSIONS.CLIENTS_MANAGE,
  PERMISSIONS.VEHICLES_VIEW,
  PERMISSIONS.MAINTENANCE_VIEW,
  PERMISSIONS.DEBTS_VIEW,
];
