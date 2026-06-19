-- ================================================================
-- GoClick ERP - PostgreSQL Database Schema
-- Version: 1.0.0
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- DEPARTMENTS
-- ================================================================
CREATE TABLE departments (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(20) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    parent_id   INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- EMPLOYEES
-- ================================================================
CREATE TABLE employees (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code   VARCHAR(20) UNIQUE NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL CHECK (role IN ('admin','hr','affiliate_manager','accountant','employee')),
    department_id   INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    manager_id      UUID REFERENCES employees(id) ON DELETE SET NULL,
    position        VARCHAR(100),
    hire_date       DATE NOT NULL,
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','on_leave')),
    avatar_url      TEXT,
    base_salary     NUMERIC(15,2) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_email ON employees(email);

-- ================================================================
-- WORK SHIFTS
-- ================================================================
CREATE TABLE work_shifts (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    break_mins  INTEGER DEFAULT 60
);

-- ================================================================
-- TIMESHEETS (Bảng chấm công)
-- ================================================================
CREATE TABLE timesheets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    work_date       DATE NOT NULL,
    shift_id        INTEGER REFERENCES work_shifts(id),
    check_in_time   TIMESTAMP,
    check_out_time  TIMESTAMP,
    check_in_lat    NUMERIC(10,7),
    check_in_lng    NUMERIC(10,7),
    check_out_lat   NUMERIC(10,7),
    check_out_lng   NUMERIC(10,7),
    source          VARCHAR(30) DEFAULT 'manual' CHECK (source IN ('gps','fingerprint','face','manual','sync')),
    status          VARCHAR(30) DEFAULT 'present' CHECK (status IN ('present','late','early_leave','absent','half_day','on_leave')),
    working_hours   NUMERIC(4,2),
    ot_hours        NUMERIC(4,2) DEFAULT 0,
    note            TEXT,
    device_id       VARCHAR(100),
    synced_at       TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, work_date)
);

CREATE INDEX idx_timesheets_employee ON timesheets(employee_id);
CREATE INDEX idx_timesheets_date ON timesheets(work_date);

-- ================================================================
-- LEAVE REQUESTS (Đơn nghỉ phép)
-- ================================================================
CREATE TABLE leave_types (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    paid        BOOLEAN DEFAULT TRUE,
    max_days    INTEGER DEFAULT 12
);

CREATE TABLE leave_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id   INTEGER REFERENCES leave_types(id),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    total_days      NUMERIC(4,1),
    reason          TEXT,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
    approved_by     UUID REFERENCES employees(id),
    approved_at     TIMESTAMP,
    rejection_note  TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

-- ================================================================
-- AFFILIATES (Đối tác liên kết)
-- ================================================================
CREATE TABLE affiliates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_code  VARCHAR(30) UNIQUE NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150),
    phone           VARCHAR(20),
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active','pending','suspended','terminated')),
    tier_level      INTEGER DEFAULT 1 CHECK (tier_level IN (1,2,3)),
    parent_id       UUID REFERENCES affiliates(id) ON DELETE SET NULL,  -- Multi-level support
    manager_id      UUID REFERENCES employees(id) ON DELETE SET NULL,
    traffic_source  VARCHAR(50),
    bank_name       VARCHAR(100),
    bank_account    VARCHAR(50),
    tax_id          VARCHAR(20),
    total_clicks    INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_revenue   NUMERIC(15,2) DEFAULT 0,
    total_commission NUMERIC(15,2) DEFAULT 0,
    joined_at       DATE DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_affiliates_status ON affiliates(status);
CREATE INDEX idx_affiliates_manager ON affiliates(manager_id);
CREATE INDEX idx_affiliates_parent ON affiliates(parent_id);

-- ================================================================
-- COMMISSION CONFIG (Cấu hình hoa hồng)
-- ================================================================
CREATE TABLE commission_configs (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    tier_level      INTEGER NOT NULL,
    rate_percent    NUMERIC(5,2) NOT NULL,
    min_conversions INTEGER DEFAULT 0,
    min_revenue     NUMERIC(15,2) DEFAULT 0,
    effective_from  DATE DEFAULT CURRENT_DATE,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- AFFILIATE CONVERSIONS (Ghi nhận chuyển đổi)
-- ================================================================
CREATE TABLE affiliate_conversions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    order_id        VARCHAR(100),
    click_id        VARCHAR(200),
    postback_raw    JSONB,
    revenue         NUMERIC(15,2) NOT NULL DEFAULT 0,
    commission_rate NUMERIC(5,2),
    commission_amt  NUMERIC(15,2),
    source_network  VARCHAR(100),
    conversion_time TIMESTAMP DEFAULT NOW(),
    status          VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','rejected','fraud')),
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversions_affiliate ON affiliate_conversions(affiliate_id);
CREATE INDEX idx_conversions_time ON affiliate_conversions(conversion_time);
CREATE INDEX idx_conversions_status ON affiliate_conversions(status);

-- ================================================================
-- AFFILIATE PAYOUTS (Hoa hồng chi trả)
-- ================================================================
CREATE TABLE affiliate_payouts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    period_from     DATE NOT NULL,
    period_to       DATE NOT NULL,
    tier_level      INTEGER,
    total_clicks    INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    gross_revenue   NUMERIC(15,2) DEFAULT 0,
    commission_rate NUMERIC(5,2),
    commission_amt  NUMERIC(15,2) NOT NULL,
    parent_commission NUMERIC(15,2) DEFAULT 0,  -- Hoa hồng cấp trên nhận
    net_payable     NUMERIC(15,2),
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','reviewed','approved','paid','disputed')),
    reviewed_by     UUID REFERENCES employees(id),   -- AM đối soát
    approved_by     UUID REFERENCES employees(id),   -- Kế toán duyệt
    paid_at         TIMESTAMP,
    payment_ref     VARCHAR(100),
    payment_method  VARCHAR(50),
    note            TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payouts_affiliate ON affiliate_payouts(affiliate_id);
CREATE INDEX idx_payouts_status ON affiliate_payouts(status);
CREATE INDEX idx_payouts_period ON affiliate_payouts(period_from, period_to);

-- ================================================================
-- WORKFLOW REQUESTS (Luồng phê duyệt)
-- ================================================================
CREATE TABLE workflow_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type            VARCHAR(50) NOT NULL CHECK (type IN ('leave_request','payout_approval','shift_change','overtime')),
    title           VARCHAR(200) NOT NULL,
    requester_id    UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    ref_id          UUID,                    -- ID tham chiếu (leave/payout)
    current_step    INTEGER DEFAULT 1,
    total_steps     INTEGER DEFAULT 2,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','approved','rejected','cancelled')),
    priority        VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
    due_date        DATE,
    created_at      TIMESTAMP DEFAULT NOW(),
    completed_at    TIMESTAMP
);

CREATE TABLE workflow_steps (
    id              SERIAL PRIMARY KEY,
    request_id      UUID NOT NULL REFERENCES workflow_requests(id) ON DELETE CASCADE,
    step_number     INTEGER NOT NULL,
    step_name       VARCHAR(100) NOT NULL,
    assignee_role   VARCHAR(50) NOT NULL,
    assignee_id     UUID REFERENCES employees(id),
    action          VARCHAR(20) CHECK (action IN ('approve','reject','request_info')),
    note            TEXT,
    acted_at        TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflow_requester ON workflow_requests(requester_id);
CREATE INDEX idx_workflow_status ON workflow_requests(status);
CREATE INDEX idx_workflow_type ON workflow_requests(type);

-- ================================================================
-- INTEGRATION CONFIGS (Cấu hình tích hợp)
-- ================================================================
CREATE TABLE integrations (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    type            VARCHAR(50) NOT NULL CHECK (type IN ('payment_gateway','tracking_network','attendance_device','webhook')),
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','error')),
    config          JSONB NOT NULL DEFAULT '{}',
    last_sync       TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- AUDIT LOG
-- ================================================================
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    actor_id        UUID REFERENCES employees(id),
    action          VARCHAR(50) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       TEXT,
    old_value       JSONB,
    new_value       JSONB,
    ip_address      INET,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ================================================================
-- SEED DATA - Phòng ban
-- ================================================================
INSERT INTO departments (code, name, parent_id) VALUES
    ('BGD', 'Ban Giám Đốc', NULL),
    ('MKT', 'Phòng Marketing', NULL),
    ('HR', 'Phòng Nhân Sự', NULL),
    ('ACC', 'Phòng Kế Toán', NULL);

INSERT INTO departments (code, name, parent_id) VALUES
    ('MKT-CNT', 'Content Marketing', 2),
    ('MKT-DIG', 'Digital Marketing', 2),
    ('MKT-AFF', 'Affiliate Marketing', 2),
    ('MKT-AUTO', 'Marketing Automation', 2),
    ('HR-PRF', 'Hồ Sơ Nhân Sự', 3),
    ('HR-ATT', 'Chấm Công', 3),
    ('HR-KPI', 'KPI/OKR', 3),
    ('HR-SAL', 'Bảng Lương', 3),
    ('ACC-INV', 'Hóa Đơn', 4),
    ('ACC-CF', 'Thu Chi', 4),
    ('ACC-DEBT', 'Công Nợ', 4),
    ('ACC-COM', 'Hoa Hồng Affiliate', 4);

-- ================================================================
-- SEED DATA - Ca làm việc
-- ================================================================
INSERT INTO work_shifts (name, start_time, end_time, break_mins) VALUES
    ('Ca Sáng', '08:00', '17:00', 60),
    ('Ca Chiều', '13:00', '22:00', 60),
    ('Ca Hành Chính', '08:30', '17:30', 60);

-- ================================================================
-- SEED DATA - Loại nghỉ phép
-- ================================================================
INSERT INTO leave_types (name, paid, max_days) VALUES
    ('Nghỉ phép năm', TRUE, 12),
    ('Nghỉ ốm', TRUE, 5),
    ('Nghỉ không lương', FALSE, 30),
    ('Nghỉ thai sản', TRUE, 180),
    ('Nghỉ cưới', TRUE, 3);

-- ================================================================
-- SEED DATA - Cấu hình hoa hồng
-- ================================================================
INSERT INTO commission_configs (name, tier_level, rate_percent, min_conversions, effective_from) VALUES
    ('Hoa hồng cấp 1', 1, 10.00, 0, '2024-01-01'),
    ('Hoa hồng cấp 2', 2, 3.00, 0, '2024-01-01'),
    ('Hoa hồng cấp 3', 3, 1.00, 0, '2024-01-01');

-- ================================================================
-- SEED DATA - Tích hợp
-- ================================================================
INSERT INTO integrations (name, type, status, config) VALUES
    ('PayPal', 'payment_gateway', 'active', '{"client_id":"demo","currency":"USD"}'),
    ('VNPAY', 'payment_gateway', 'active', '{"merchant_id":"DEMO","currency":"VND"}'),
    ('Máy chấm công ZKTeco', 'attendance_device', 'active', '{"ip":"192.168.1.100","port":4370}'),
    ('AccessTrade Network', 'tracking_network', 'active', '{"api_key":"demo_key","postback_url":"/api/affiliate/postback"}'),
    ('Admitad Network', 'tracking_network', 'inactive', '{"api_key":"","postback_url":"/api/affiliate/postback/admitad"}');
