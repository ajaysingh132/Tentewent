-- ============================================
-- TentHouse OS V1.0 - Master Database Schema
-- Database: PostgreSQL 15+
-- Encoding: UTF-8
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- 1. GEOGRAPHY TABLES (State/District/City)
-- ============================================
CREATE TABLE states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    state_id INT REFERENCES states(id),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(state_id, name)
);

CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    district_id INT REFERENCES districts(id),
    name VARCHAR(100) NOT NULL,
    pincode VARCHAR(10),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 2. USERS & AUTHENTICATION
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(150) NOT NULL,
    profile_image VARCHAR(500),    role VARCHAR(30) NOT NULL CHECK (role IN (
        'super_admin','state_admin','district_admin','city_admin',
        'tent_owner','branch_manager','staff','driver','worker',
        'customer','vendor','decorator','caterer','photographer',
        'dj','electrician','generator_provider'
    )),
    city_id INT REFERENCES cities(id),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE otp_logs (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(15) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    purpose VARCHAR(30) DEFAULT 'login',
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_devices (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_token VARCHAR(500) NOT NULL,
    platform VARCHAR(10) CHECK (platform IN ('android','ios','web')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. TENT HOUSE (BUSINESS)
-- ============================================
CREATE TABLE tent_houses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id),
    business_name VARCHAR(200) NOT NULL,
    tagline VARCHAR(250),
    description TEXT,
    logo VARCHAR(500),
    cover_image VARCHAR(500),
    gst_number VARCHAR(20) UNIQUE,
    pan_number VARCHAR(15) UNIQUE,
    bank_account JSONB,
    city_id INT REFERENCES cities(id),
    full_address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),    phone VARCHAR(15),
    whatsapp VARCHAR(15),
    email VARCHAR(150),
    website VARCHAR(200),
    established_year INT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(2,1) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    membership_plan VARCHAR(30) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tent_house_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tent_house_id UUID REFERENCES tent_houses(id) ON DELETE CASCADE,
    branch_name VARCHAR(150) NOT NULL,
    city_id INT REFERENCES cities(id),
    address TEXT,
    manager_id UUID REFERENCES users(id),
    phone VARCHAR(15),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE tent_house_gallery (
    id SERIAL PRIMARY KEY,
    tent_house_id UUID REFERENCES tent_houses(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    category VARCHAR(50),
    sort_order INT DEFAULT 0
);

-- ============================================
-- 4. INVENTORY (MATERIALS)
-- ============================================
CREATE TABLE inventory_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(100),
    parent_id INT REFERENCES inventory_categories(id)
);

-- Seed categories
INSERT INTO inventory_categories (name) VALUES
('Tent'),('Stage'),('Sofa'),('Chair'),('Table'),('VIP Chair'),
('LED Wall'),('Sound System'),('DJ'),('Lighting'),
('Flower Decoration'),('Generator'),('Carpet'),('Cooler'),
('AC'),('Crockery'),('Kitchen Items'),('Vehicle'),('Tools');

CREATE TABLE inventory_items (    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tent_house_id UUID REFERENCES tent_houses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES tent_house_branches(id),
    category_id INT REFERENCES inventory_categories(id),
    item_name VARCHAR(200) NOT NULL,
    description TEXT,
    sku VARCHAR(50),
    barcode VARCHAR(50) UNIQUE,
    qr_code VARCHAR(255),
    quantity INT DEFAULT 0,
    available_qty INT DEFAULT 0,
    damaged_qty INT DEFAULT 0,
    unit VARCHAR(30) DEFAULT 'piece',
    rental_price DECIMAL(10,2),
    purchase_price DECIMAL(10,2),
    purchase_date DATE,
    condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('new','good','fair','damaged')),
    warehouse_location VARCHAR(100),
    images JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    item_id UUID REFERENCES inventory_items(id),
    tent_house_id UUID REFERENCES tent_houses(id),
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('in','out','damage','repair','return')),
    quantity INT NOT NULL,
    booking_id UUID,
    notes TEXT,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. SERVICES & PACKAGES
-- ============================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tent_house_id UUID REFERENCES tent_houses(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    base_price DECIMAL(10,2),
    price_unit VARCHAR(30) DEFAULT 'event',
    images JSONB,
    is_active BOOLEAN DEFAULT TRUE
);
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tent_house_id UUID REFERENCES tent_houses(id) ON DELETE CASCADE,
    package_name VARCHAR(200) NOT NULL,
    package_type VARCHAR(30) CHECK (package_type IN ('wedding','birthday','corporate','religious','political','custom')),
    description TEXT,
    total_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    includes JSONB NOT NULL,
    images JSONB,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 6. BOOKINGS
-- ============================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(30) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id),
    tent_house_id UUID REFERENCES tent_houses(id),
    branch_id UUID REFERENCES tent_house_branches(id),
    package_id UUID REFERENCES packages(id),

    event_type VARCHAR(50) NOT NULL,
    event_name VARCHAR(200),
    event_date DATE NOT NULL,
    event_time TIME,
    event_end_date DATE,
    venue_address TEXT NOT NULL,
    venue_latitude DECIMAL(10,8),
    venue_longitude DECIMAL(11,8),

    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    advance_paid DECIMAL(10,2) DEFAULT 0,
    pending_amount DECIMAL(10,2),

    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending','confirmed','in_progress','completed','cancelled','refunded'
    )),
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN (
        'unpaid','partial','paid','refunded'
    )),

    special_instructions TEXT,
    created_by UUID REFERENCES users(id),    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE booking_items (
    id SERIAL PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    item_type VARCHAR(20) CHECK (item_type IN ('package','inventory','service')),
    item_id UUID,
    item_name VARCHAR(200) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2)
);

-- ============================================
-- 7. PAYMENTS
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    customer_id UUID REFERENCES users(id),
    tent_house_id UUID REFERENCES tent_houses(id),

    amount DECIMAL(10,2) NOT NULL,
    payment_mode VARCHAR(20) CHECK (payment_mode IN (
        'upi','card','netbanking','wallet','emi','cash','cheque'
    )),
    gateway VARCHAR(20) CHECK (gateway IN ('razorpay','phonepe','cashfree')),
    gateway_txn_id VARCHAR(100),
    gateway_order_id VARCHAR(100),

    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending','success','failed','refunded'
    )),
    payment_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 8. EMPLOYEES & ATTENDANCE
-- ============================================
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    tent_house_id UUID REFERENCES tent_houses(id),
    branch_id UUID REFERENCES tent_house_branches(id),
    employee_code VARCHAR(30) UNIQUE,
    designation VARCHAR(50),    department VARCHAR(50),
    salary_type VARCHAR(20) CHECK (salary_type IN ('monthly','daily','contract')),
    salary_amount DECIMAL(10,2),
    joining_date DATE,
    documents JSONB,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id UUID REFERENCES employees(id),
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    check_in_location POINT,
    check_out_location POINT,
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present','absent','leave','half_day')),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    notes TEXT,
    UNIQUE(employee_id, date)
);

CREATE TABLE salary_records (
    id SERIAL PRIMARY KEY,
    employee_id UUID REFERENCES employees(id),
    month INT NOT NULL,
    year INT NOT NULL,
    basic_salary DECIMAL(10,2),
    overtime_amount DECIMAL(10,2) DEFAULT 0,
    advance_deducted DECIMAL(10,2) DEFAULT 0,
    incentive DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','paid')),
    paid_on DATE,
    UNIQUE(employee_id, month, year)
);

-- ============================================
-- 9. VEHICLES & DELIVERY
-- ============================================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tent_house_id UUID REFERENCES tent_houses(id),
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(30),
    capacity_kg DECIMAL(8,2),
    driver_id UUID REFERENCES users(id),
    gps_device_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES users(id),
    delivery_type VARCHAR(20) CHECK (delivery_type IN ('delivery','pickup')),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled','in_transit','delivered','picked','failed'
    )),
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    route JSONB,
    notes TEXT
);

CREATE TABLE delivery_tracking (
    id SERIAL PRIMARY KEY,
    delivery_id UUID REFERENCES deliveries(id),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    speed DECIMAL(5,2),
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 10. CRM & LEADS
-- ============================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tent_house_id UUID REFERENCES tent_houses(id),
    customer_name VARCHAR(150),
    phone VARCHAR(15),
    email VARCHAR(150),
    event_type VARCHAR(50),
    event_date DATE,
    budget DECIMAL(10,2),
    source VARCHAR(30),
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN (
        'new','contacted','qualified','proposal','won','lost'
    )),
    assigned_to UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE follow_ups (
    id SERIAL PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,    follow_up_date TIMESTAMP NOT NULL,
    notes TEXT,
    status VARCHAR(20),
    created_by UUID REFERENCES users(id)
);

-- ============================================
-- 11. REVIEWS & RATINGS
-- ============================================
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id),
    customer_id UUID REFERENCES users(id),
    tent_house_id UUID REFERENCES tent_houses(id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    images JSONB,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 12. NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    body TEXT,
    type VARCHAR(30),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    channel VARCHAR(20) DEFAULT 'push' CHECK (channel IN ('push','sms','email','whatsapp')),
    sent_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 13. FINANCE (LEDGER)
-- ============================================
CREATE TABLE ledger_entries (
    id SERIAL PRIMARY KEY,
    tent_house_id UUID REFERENCES tent_houses(id),
    entry_type VARCHAR(20) CHECK (entry_type IN ('income','expense')),
    category VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_id UUID,
    reference_type VARCHAR(30),
    entry_date DATE NOT NULL,
    created_by UUID REFERENCES users(id),    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 14. VENDORS
-- ============================================
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tent_house_id UUID REFERENCES tent_houses(id),
    vendor_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(15),
    email VARCHAR(150),
    category VARCHAR(50),
    gst_number VARCHAR(20),
    rating DECIMAL(2,1) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tent_house_id UUID REFERENCES tent_houses(id),
    vendor_id UUID REFERENCES vendors(id),
    po_number VARCHAR(30) UNIQUE,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'draft',
    order_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 15. AI & AUTOMATION
-- ============================================
CREATE TABLE ai_recommendations (
    id SERIAL PRIMARY KEY,
    tent_house_id UUID REFERENCES tent_houses(id),
    customer_id UUID,
    recommendation_type VARCHAR(30),
    data JSONB,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id),
    tent_house_id UUID REFERENCES tent_houses(id),
    is_ai_handled BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'open',    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) CHECK (sender_type IN ('customer','business','ai')),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 16. AUDIT & SECURITY
-- ============================================
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES (Performance)
-- ============================================
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_tent_houses_city ON tent_houses(city_id);
CREATE INDEX idx_tent_houses_owner ON tent_houses(owner_id);
CREATE INDEX idx_inventory_tent_house ON inventory_items(tent_house_id);
CREATE INDEX idx_inventory_category ON inventory_items(category_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_tent_house ON bookings(tent_house_id);
CREATE INDEX idx_bookings_date ON bookings(event_date);CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);

-- ============================================
-- TRIGGERS (Auto-updates)
-- ============================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_bookings_updated
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================
-- END OF SCHEMA
-- ============================================
