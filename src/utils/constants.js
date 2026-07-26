module.exports = {
  // Role Levels
  ROLE_LEVELS: {
    SUPER_ADMIN: 1,
    STATE_ADMIN: 2,
    DISTRICT_ADMIN: 3,
    CITY_ADMIN: 4,
    BUSINESS_OWNER: 5,
    STAFF: 6,
    CUSTOMER: 7,
  },

  // System Roles
  SYSTEM_ROLES: {
    SUPER_ADMIN: 'super_admin',
    STATE_ADMIN: 'state_admin',
    DISTRICT_ADMIN: 'district_admin',
    CITY_ADMIN: 'city_admin',
    TENT_OWNER: 'tent_owner',
    BRANCH_MANAGER: 'branch_manager',
    STAFF: 'staff',
    DRIVER: 'driver',
    WORKER: 'worker',
    CUSTOMER: 'customer',
    VENDOR: 'vendor',
    DECORATOR: 'decorator',
    CATERER: 'caterer',
    PHOTOGRAPHER: 'photographer',
    DJ: 'dj',
    ELECTRICIAN: 'electrician',
    GENERATOR_PROVIDER: 'generator_provider',
  },

  // Permission Modules
  PERMISSION_MODULES: {
    AUTH: 'auth',
    BOOKING: 'booking',
    INVENTORY: 'inventory',
    PAYMENT: 'payment',
    CUSTOMER: 'customer',
    EMPLOYEE: 'employee',
    VEHICLE: 'vehicle',
    REPORT: 'report',
    SETTINGS: 'settings',
    ADMIN: 'admin',
  },

  // Permission Actions
  PERMISSION_ACTIONS: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    APPROVE: 'approve',
    CANCEL: 'cancel',
    EXPORT: 'export',
    ASSIGN: 'assign',
    TRANSFER: 'transfer',
    REFUND: 'refund',
  },
};
