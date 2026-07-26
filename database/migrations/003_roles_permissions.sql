-- ============================================
-- TentHouse OS - Roles & Permissions Schema
-- ============================================

-- ============================================
-- 1. ROLES TABLE
-- ============================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    role_level INT NOT NULL, -- 1=Super Admin, 2=State, 3=District, 4=City, 5=Business, 6=Staff
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. PERMISSIONS TABLE
-- ============================================
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL, -- auth, booking, inventory, payment, etc.
    action VARCHAR(30) NOT NULL, -- create, read, update, delete, approve, etc.
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. ROLE-PERMISSION MAPPING
-- ============================================
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    is_allowed BOOLEAN DEFAULT TRUE,
    UNIQUE(role_id, permission_id)
);

-- ============================================
-- 4. USER-ROLE MAPPING (Multi-role support)
-- ============================================
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    tent_house_id UUID REFERENCES tent_houses(id) ON DELETE CASCADE, -- NULL for platform admins    branch_id UUID REFERENCES tent_house_branches(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT TRUE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, role_id, tent_house_id)
);

-- ============================================
-- 5. ROLE HIERARCHY (For inheritance)
-- ============================================
CREATE TABLE role_hierarchy (
    id SERIAL PRIMARY KEY,
    parent_role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    child_role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE(parent_role_id, child_role_id)
);

-- ============================================
-- 6. PERMISSION GROUPS (For UI)
-- ============================================
CREATE TABLE permission_groups (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0
);

ALTER TABLE permissions ADD COLUMN group_id INT REFERENCES permission_groups(id);

-- ============================================
-- SEED DATA: ROLES
-- ============================================
INSERT INTO roles (role_name, display_name, description, role_level, is_system_role) VALUES
-- Platform Admins (Level 1-4)
('super_admin', 'Super Admin', 'Full platform access', 1, TRUE),
('state_admin', 'State Admin', 'State-level management', 2, TRUE),
('district_admin', 'District Admin', 'District-level management', 3, TRUE),
('city_admin', 'City Admin', 'City-level management', 4, TRUE),

-- Business Owners (Level 5)
('tent_owner', 'Tent House Owner', 'Business owner with full control', 5, TRUE),
('branch_manager', 'Branch Manager', 'Manages single branch', 5, TRUE),

-- Staff (Level 6)
('staff', 'Staff', 'General staff member', 6, TRUE),
('driver', 'Driver', 'Vehicle driver', 6, TRUE),
('worker', 'Worker', 'Labor/worker', 6, TRUE),
-- Customers & Vendors
('customer', 'Customer', 'End customer', 7, TRUE),
('vendor', 'Vendor', 'External vendor', 7, TRUE),

-- Specialized Roles
('decorator', 'Decorator', 'Decoration specialist', 6, TRUE),
('caterer', 'Caterer', 'Catering specialist', 6, TRUE),
('photographer', 'Photographer', 'Photography specialist', 6, TRUE),
('dj', 'DJ', 'DJ specialist', 6, TRUE),
('electrician', 'Electrician', 'Electrical specialist', 6, TRUE),
('generator_provider', 'Generator Provider', 'Generator service provider', 6, TRUE);

-- ============================================
-- SEED DATA: PERMISSION GROUPS
-- ============================================
INSERT INTO permission_groups (group_name, display_name, icon, sort_order) VALUES
('auth', 'Authentication', '🔐', 1),
('booking', 'Bookings', '📅', 2),
('inventory', 'Inventory', '📦', 3),
('payment', 'Payments', '💳', 4),
('customer', 'Customers', '👥', 5),
('employee', 'Employees', '👔', 6),
('vehicle', 'Vehicles', '🚚', 7),
('report', 'Reports', '📊', 8),
('settings', 'Settings', '⚙️', 9),
('admin', 'Administration', '🛡️', 10);

-- ============================================
-- SEED DATA: PERMISSIONS (100+ permissions)
-- ============================================
INSERT INTO permissions (permission_name, display_name, module, action, group_id) VALUES
-- Auth Module
('auth.view_own', 'View Own Profile', 'auth', 'read', 1),
('auth.edit_own', 'Edit Own Profile', 'auth', 'update', 1),
('auth.delete_own', 'Delete Own Account', 'auth', 'delete', 1),

-- Booking Module
('booking.create', 'Create Booking', 'booking', 'create', 2),
('booking.view_own', 'View Own Bookings', 'booking', 'read', 2),
('booking.view_all', 'View All Bookings', 'booking', 'read', 2),
('booking.edit', 'Edit Booking', 'booking', 'update', 2),
('booking.delete', 'Delete Booking', 'booking', 'delete', 2),
('booking.approve', 'Approve Booking', 'booking', 'approve', 2),
('booking.cancel', 'Cancel Booking', 'booking', 'cancel', 2),

-- Inventory Module
('inventory.create', 'Add Inventory Item', 'inventory', 'create', 3),
('inventory.view_own', 'View Own Inventory', 'inventory', 'read', 3),
('inventory.view_all', 'View All Inventory', 'inventory', 'read', 3),('inventory.edit', 'Edit Inventory', 'inventory', 'update', 3),
('inventory.delete', 'Delete Inventory', 'inventory', 'delete', 3),
('inventory.transfer', 'Transfer Inventory', 'inventory', 'transfer', 3),

-- Payment Module
('payment.create', 'Create Payment', 'payment', 'create', 4),
('payment.view_own', 'View Own Payments', 'payment', 'read', 4),
('payment.view_all', 'View All Payments', 'payment', 'read', 4),
('payment.refund', 'Process Refund', 'payment', 'refund', 4),

-- Customer Module
('customer.create', 'Add Customer', 'customer', 'create', 5),
('customer.view_own', 'View Own Customers', 'customer', 'read', 5),
('customer.view_all', 'View All Customers', 'customer', 'read', 5),
('customer.edit', 'Edit Customer', 'customer', 'update', 5),
('customer.delete', 'Delete Customer', 'customer', 'delete', 5),

-- Employee Module
('employee.create', 'Add Employee', 'employee', 'create', 6),
('employee.view_own', 'View Own Employees', 'employee', 'read', 6),
('employee.view_all', 'View All Employees', 'employee', 'read', 6),
('employee.edit', 'Edit Employee', 'employee', 'update', 6),
('employee.delete', 'Delete Employee', 'employee', 'delete', 6),
('employee.assign_role', 'Assign Role to Employee', 'employee', 'assign', 6),

-- Vehicle Module
('vehicle.create', 'Add Vehicle', 'vehicle', 'create', 7),
('vehicle.view_own', 'View Own Vehicles', 'vehicle', 'read', 7),
('vehicle.view_all', 'View All Vehicles', 'vehicle', 'read', 7),
('vehicle.edit', 'Edit Vehicle', 'vehicle', 'update', 7),
('vehicle.delete', 'Delete Vehicle', 'vehicle', 'delete', 7),
('vehicle.assign_driver', 'Assign Driver', 'vehicle', 'assign', 7),

-- Report Module
('report.view_own', 'View Own Reports', 'report', 'read', 8),
('report.view_all', 'View All Reports', 'report', 'read', 8),
('report.export', 'Export Reports', 'report', 'export', 8),
('report.finance', 'View Finance Reports', 'report', 'read', 8),

-- Settings Module
('settings.view', 'View Settings', 'settings', 'read', 9),
('settings.edit', 'Edit Settings', 'settings', 'update', 9),
('settings.manage_payment', 'Manage Payment Gateway', 'settings', 'update', 9),
('settings.manage_notification', 'Manage Notifications', 'settings', 'update', 9),

-- Admin Module
('admin.view_users', 'View All Users', 'admin', 'read', 10),
('admin.manage_users', 'Manage Users', 'admin', 'update', 10),
('admin.manage_roles', 'Manage Roles', 'admin', 'update', 10),
('admin.manage_permissions', 'Manage Permissions', 'admin', 'update', 10),('admin.view_audit_logs', 'View Audit Logs', 'admin', 'read', 10),
('admin.manage_tent_houses', 'Manage Tent Houses', 'admin', 'update', 10),
('admin.manage_cities', 'Manage Cities', 'admin', 'update', 10),
('admin.view_platform_stats', 'View Platform Statistics', 'admin', 'read', 10);

-- ============================================
-- SEED DATA: ROLE-PERMISSION MAPPING
-- ============================================

-- Super Admin: ALL permissions
INSERT INTO role_permissions (role_id, permission_id, is_allowed)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.role_name = 'super_admin';

-- State Admin: Most permissions except super admin functions
INSERT INTO role_permissions (role_id, permission_id, is_allowed)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.role_name = 'state_admin'
AND p.permission_name NOT IN ('admin.manage_roles', 'admin.manage_permissions');

-- District Admin: Similar to State Admin
INSERT INTO role_permissions (role_id, permission_id, is_allowed)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.role_name = 'district_admin'
AND p.permission_name NOT IN ('admin.manage_roles', 'admin.manage_permissions', 'admin.manage_cities');

-- City Admin: Similar to District Admin
INSERT INTO role_permissions (role_id, permission_id, is_allowed)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.role_name = 'city_admin'
AND p.permission_name NOT IN ('admin.manage_roles', 'admin.manage_permissions', 'admin.manage_cities', 'admin.manage_tent_houses');

-- Tent Owner: Business-level permissions
INSERT INTO role_permissions (role_id, permission_id, is_allowed)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.role_name = 'tent_owner'
AND p.module IN ('booking', 'inventory', 'payment', 'customer', 'employee', 'vehicle', 'report', 'settings')
AND p.permission_name NOT LIKE 'admin.%';

-- Branch Manager: Similar to Tent Owner but limited to branch
INSERT INTO role_permissions (role_id, permission_id, is_allowed)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.role_name = 'branch_manager'
AND p.module IN ('booking', 'inventory', 'payment', 'customer', 'employee', 'vehicle', 'report')AND p.permission_name NOT LIKE 'admin.%'
AND p.permission_name NOT LIKE 'settings.manage_%';

-- Staff: Limited permissions
INSERT INTO role_permissions (role_id, permission_id, is_allowed)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.role_name = 'staff'
AND p.permission_name IN (
    'auth.view_own', 'auth.edit_own',
    'booking.view_own', 'booking.create',
    'inventory.view_own',
    'customer.view_own', 'customer.create',
    'report.view_own'
);

-- Driver: Vehicle and delivery permissions
INSERT INTO role_permissions (role_id, permission_id, is_allowed)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.role_name = 'driver'
AND p.permission_name IN (
    'auth.view_own', 'auth.edit_own',
    'vehicle.view_own',
    'booking.view_own'
);

-- Worker: Very limited permissions
INSERT INTO role_permissions (role_id, permission_id, is_allowed)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.role_name = 'worker'
AND p.permission_name IN ('auth.view_own', 'auth.edit_own');

-- Customer: Own data only
INSERT INTO role_permissions (role_id, permission_id, is_allowed)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.role_name = 'customer'
AND p.permission_name IN (
    'auth.view_own', 'auth.edit_own', 'auth.delete_own',
    'booking.create', 'booking.view_own',
    'payment.create', 'payment.view_own'
);

-- Vendor: Limited business permissions
INSERT INTO role_permissions (role_id, permission_id, is_allowed)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.role_name = 'vendor'AND p.permission_name IN (
    'auth.view_own', 'auth.edit_own',
    'booking.view_own',
    'inventory.view_own'
);

-- Specialized roles (decorator, caterer, etc.): Similar to staff
INSERT INTO role_permissions (role_id, permission_id, is_allowed)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.role_name IN ('decorator', 'caterer', 'photographer', 'dj', 'electrician', 'generator_provider')
AND p.permission_name IN (
    'auth.view_own', 'auth.edit_own',
    'booking.view_own',
    'inventory.view_own'
);

-- ============================================
-- SEED DATA: ROLE HIERARCHY
-- ============================================
INSERT INTO role_hierarchy (parent_role_id, child_role_id)
SELECT p.id, c.id
FROM roles p, roles c
WHERE
    (p.role_name = 'super_admin' AND c.role_name IN ('state_admin', 'district_admin', 'city_admin'))
    OR (p.role_name = 'state_admin' AND c.role_name IN ('district_admin', 'city_admin'))
    OR (p.role_name = 'district_admin' AND c.role_name = 'city_admin')
    OR (p.role_name = 'tent_owner' AND c.role_name IN ('branch_manager', 'staff', 'driver', 'worker'))
    OR (p.role_name = 'branch_manager' AND c.role_name IN ('staff', 'driver', 'worker'));

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_tent_house ON user_roles(tent_house_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_permissions_module ON permissions(module);

-- ============================================
-- VIEWS (For easy querying)
-- ============================================
CREATE VIEW user_permissions_view AS
SELECT
    ur.user_id,
    ur.role_id,
    r.role_name,
    r.display_name as role_display_name,
    p.id as permission_id,
    p.permission_name,    p.display_name as permission_display_name,
    p.module,
    p.action,
    ur.tent_house_id,
    ur.branch_id,
    ur.is_active
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id AND rp.is_allowed = TRUE
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.is_active = TRUE;

-- ============================================
-- FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_permission_name VARCHAR,
    p_tent_house_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM user_permissions_view
        WHERE user_id = p_user_id
        AND permission_name = p_permission_name
        AND (p_tent_house_id IS NULL OR tent_house_id = p_tent_house_id)
        AND is_active = TRUE
    ) INTO has_permission;

    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- END OF MIGRATION
-- ============================================
