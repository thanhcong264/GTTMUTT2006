"""
GoClick ERP - Mock Data Store
Simulates database in-memory for demo purposes (no PostgreSQL required)
"""
from datetime import datetime, date, timedelta
import uuid

# ─────────────────────────────────────────────
# EMPLOYEES
# ─────────────────────────────────────────────
EMPLOYEES = [
    {
        "id": "emp-001",
        "employee_code": "GC001",
        "full_name": "Nguyễn Văn Admin",
        "email": "admin@goclick.vn",
        "password": "admin123",
        "role": "admin",
        "department": "Ban Giám Đốc",
        "department_id": 1,
        "position": "CEO",
        "hire_date": "2022-01-01",
        "status": "active",
        "base_salary": 50000000,
        "avatar": "NV",
    },
    {
        "id": "emp-002",
        "employee_code": "GC002",
        "full_name": "Trần Thị HR",
        "email": "hr@goclick.vn",
        "password": "hr123",
        "role": "hr",
        "department": "Phòng Nhân Sự",
        "department_id": 3,
        "position": "HR Manager",
        "hire_date": "2022-03-15",
        "status": "active",
        "base_salary": 25000000,
        "avatar": "TH",
    },
    {
        "id": "emp-003",
        "employee_code": "GC003",
        "full_name": "Lê Minh AM",
        "email": "am@goclick.vn",
        "password": "am123",
        "role": "affiliate_manager",
        "department": "Phòng Marketing",
        "department_id": 2,
        "position": "Affiliate Manager",
        "hire_date": "2022-06-01",
        "status": "active",
        "base_salary": 30000000,
        "avatar": "LM",
    },
    {
        "id": "emp-004",
        "employee_code": "GC004",
        "full_name": "Phạm Kế Toán",
        "email": "accountant@goclick.vn",
        "password": "acc123",
        "role": "accountant",
        "department": "Phòng Kế Toán",
        "department_id": 4,
        "position": "Chief Accountant",
        "hire_date": "2022-02-10",
        "status": "active",
        "base_salary": 28000000,
        "avatar": "PK",
    },
    {
        "id": "emp-005",
        "employee_code": "GC005",
        "full_name": "Hoàng Văn B",
        "email": "hvb@goclick.vn",
        "password": "hvb123",
        "role": "employee",
        "department": "Phòng Marketing",
        "department_id": 2,
        "position": "Content Creator",
        "hire_date": "2023-01-10",
        "status": "active",
        "base_salary": 15000000,
        "avatar": "HB",
    },
    {
        "id": "emp-006",
        "employee_code": "GC006",
        "full_name": "Nguyễn Thị C",
        "email": "ntc@goclick.vn",
        "password": "ntc123",
        "role": "employee",
        "department": "Phòng Marketing",
        "department_id": 2,
        "position": "Digital Marketer",
        "hire_date": "2023-03-20",
        "status": "active",
        "base_salary": 18000000,
        "avatar": "NC",
    },
]

# ─────────────────────────────────────────────
# TIMESHEETS (current month)
# ─────────────────────────────────────────────
def generate_timesheets():
    records = []
    today = date.today()
    month_start = today.replace(day=1)

    statuses = ["present", "late", "present", "present", "absent", "present", "present", "half_day", "present", "present"]
    emp_ids = ["emp-001", "emp-002", "emp-003", "emp-004", "emp-005", "emp-006"]

    for emp_id in emp_ids:
        current = month_start
        stat_idx = 0
        while current <= today:
            if current.weekday() < 5:  # Mon-Fri only
                status = statuses[stat_idx % len(statuses)]
                check_in = datetime.combine(current, datetime.strptime("08:05", "%H:%M").time())
                check_out = datetime.combine(current, datetime.strptime("17:30", "%H:%M").time())
                if status == "late":
                    check_in = datetime.combine(current, datetime.strptime("09:15", "%H:%M").time())
                elif status == "absent":
                    check_in = None
                    check_out = None
                elif status == "half_day":
                    check_out = datetime.combine(current, datetime.strptime("12:00", "%H:%M").time())

                records.append({
                    "id": str(uuid.uuid4()),
                    "employee_id": emp_id,
                    "work_date": current.isoformat(),
                    "check_in_time": check_in.isoformat() if check_in else None,
                    "check_out_time": check_out.isoformat() if check_out else None,
                    "status": status,
                    "source": "gps" if emp_id == "emp-003" else "fingerprint",
                    "working_hours": 8.0 if status == "present" else (4.0 if status == "half_day" else 0),
                    "ot_hours": 1.5 if status == "present" and emp_id == "emp-001" else 0,
                })
                stat_idx += 1
            current += timedelta(days=1)
    return records


TIMESHEETS = generate_timesheets()

# ─────────────────────────────────────────────
# AFFILIATES
# ─────────────────────────────────────────────
AFFILIATES = [
    {
        "id": "aff-001",
        "affiliate_code": "AF001",
        "full_name": "Công ty TNHH MediaPro",
        "email": "contact@mediapro.vn",
        "phone": "0901234567",
        "status": "active",
        "tier_level": 1,
        "parent_id": None,
        "manager_id": "emp-003",
        "traffic_source": "SEO / Blog",
        "total_clicks": 15240,
        "total_conversions": 892,
        "total_revenue": 267600000,
        "total_commission": 26760000,
        "joined_at": "2023-06-01",
    },
    {
        "id": "aff-002",
        "affiliate_code": "AF002",
        "full_name": "Nguyễn Affiliate King",
        "email": "king@affiliate.vn",
        "phone": "0912345678",
        "status": "active",
        "tier_level": 1,
        "parent_id": None,
        "manager_id": "emp-003",
        "traffic_source": "Facebook Ads",
        "total_clicks": 8920,
        "total_conversions": 456,
        "total_revenue": 136800000,
        "total_commission": 13680000,
        "joined_at": "2023-08-15",
    },
    {
        "id": "aff-003",
        "affiliate_code": "AF003",
        "full_name": "Digital Star Agency",
        "email": "info@digitalstar.vn",
        "phone": "0923456789",
        "status": "pending",
        "tier_level": 2,
        "parent_id": "aff-001",
        "manager_id": "emp-003",
        "traffic_source": "TikTok",
        "total_clicks": 3450,
        "total_conversions": 120,
        "total_revenue": 36000000,
        "total_commission": 3600000,
        "joined_at": "2024-01-10",
    },
    {
        "id": "aff-004",
        "affiliate_code": "AF004",
        "full_name": "Trần Review YouTube",
        "email": "review@youtube.com",
        "phone": "0934567890",
        "status": "active",
        "tier_level": 1,
        "parent_id": None,
        "manager_id": "emp-003",
        "traffic_source": "YouTube",
        "total_clicks": 22100,
        "total_conversions": 1345,
        "total_revenue": 403500000,
        "total_commission": 40350000,
        "joined_at": "2023-04-20",
    },
    {
        "id": "aff-005",
        "affiliate_code": "AF005",
        "full_name": "Email Marketing Pro",
        "email": "pro@emailmkt.vn",
        "phone": "0945678901",
        "status": "suspended",
        "tier_level": 2,
        "parent_id": "aff-002",
        "manager_id": "emp-003",
        "traffic_source": "Email Marketing",
        "total_clicks": 1200,
        "total_conversions": 45,
        "total_revenue": 13500000,
        "total_commission": 1350000,
        "joined_at": "2024-02-01",
    },
]

# ─────────────────────────────────────────────
# AFFILIATE PAYOUTS
# ─────────────────────────────────────────────
PAYOUTS = [
    {
        "id": "pay-001",
        "affiliate_id": "aff-001",
        "period_from": "2024-05-01",
        "period_to": "2024-05-31",
        "tier_level": 1,
        "total_clicks": 2540,
        "total_conversions": 148,
        "gross_revenue": 44400000,
        "commission_rate": 10.0,
        "commission_amt": 4440000,
        "parent_commission": 0,
        "net_payable": 4440000,
        "status": "approved",
        "reviewed_by": "emp-003",
        "approved_by": "emp-004",
        "payment_method": "Bank Transfer",
        "payment_ref": "PAY20240601001",
    },
    {
        "id": "pay-002",
        "affiliate_id": "aff-002",
        "period_from": "2024-05-01",
        "period_to": "2024-05-31",
        "tier_level": 1,
        "total_clicks": 1480,
        "total_conversions": 76,
        "gross_revenue": 22800000,
        "commission_rate": 10.0,
        "commission_amt": 2280000,
        "parent_commission": 0,
        "net_payable": 2280000,
        "status": "reviewed",
        "reviewed_by": "emp-003",
        "approved_by": None,
        "payment_method": None,
        "payment_ref": None,
    },
    {
        "id": "pay-003",
        "affiliate_id": "aff-004",
        "period_from": "2024-05-01",
        "period_to": "2024-05-31",
        "tier_level": 1,
        "total_clicks": 3680,
        "total_conversions": 224,
        "gross_revenue": 67200000,
        "commission_rate": 10.0,
        "commission_amt": 6720000,
        "parent_commission": 0,
        "net_payable": 6720000,
        "status": "pending",
        "reviewed_by": None,
        "approved_by": None,
        "payment_method": None,
        "payment_ref": None,
    },
]

# ─────────────────────────────────────────────
# WORKFLOW REQUESTS
# ─────────────────────────────────────────────
WORKFLOWS = [
    {
        "id": "wf-001",
        "type": "leave_request",
        "title": "Đơn nghỉ phép - Hoàng Văn B (03/06 - 05/06)",
        "requester_id": "emp-005",
        "requester_name": "Hoàng Văn B",
        "status": "pending",
        "priority": "normal",
        "current_step": 1,
        "total_steps": 2,
        "created_at": "2024-06-01T09:00:00",
        "steps": [
            {"step": 1, "name": "Trưởng phòng duyệt", "role": "affiliate_manager", "status": "pending"},
            {"step": 2, "name": "HR ghi nhận", "role": "hr", "status": "waiting"},
        ],
    },
    {
        "id": "wf-002",
        "type": "payout_approval",
        "title": "Duyệt hoa hồng tháng 5/2024 - Nguyễn Affiliate King",
        "requester_id": "emp-003",
        "requester_name": "Lê Minh AM",
        "status": "in_progress",
        "priority": "high",
        "current_step": 2,
        "total_steps": 2,
        "created_at": "2024-06-02T10:00:00",
        "steps": [
            {"step": 1, "name": "AM đối soát", "role": "affiliate_manager", "status": "approved", "acted_at": "2024-06-02T10:30:00"},
            {"step": 2, "name": "Kế toán trưởng duyệt chi", "role": "accountant", "status": "pending"},
        ],
    },
    {
        "id": "wf-003",
        "type": "leave_request",
        "title": "Đơn nghỉ ốm - Nguyễn Thị C (07/06)",
        "requester_id": "emp-006",
        "requester_name": "Nguyễn Thị C",
        "status": "approved",
        "priority": "normal",
        "current_step": 2,
        "total_steps": 2,
        "created_at": "2024-06-05T08:00:00",
        "steps": [
            {"step": 1, "name": "Trưởng phòng duyệt", "role": "affiliate_manager", "status": "approved", "acted_at": "2024-06-05T09:00:00"},
            {"step": 2, "name": "HR ghi nhận", "role": "hr", "status": "approved", "acted_at": "2024-06-05T11:00:00"},
        ],
    },
    {
        "id": "wf-004",
        "type": "payout_approval",
        "title": "Duyệt hoa hồng tháng 5/2024 - Trần Review YouTube",
        "requester_id": "emp-003",
        "requester_name": "Lê Minh AM",
        "status": "pending",
        "priority": "urgent",
        "current_step": 1,
        "total_steps": 2,
        "created_at": "2024-06-03T14:00:00",
        "steps": [
            {"step": 1, "name": "AM đối soát", "role": "affiliate_manager", "status": "pending"},
            {"step": 2, "name": "Kế toán trưởng duyệt chi", "role": "accountant", "status": "waiting"},
        ],
    },
]

# ─────────────────────────────────────────────
# LEAVE REQUESTS
# ─────────────────────────────────────────────
LEAVE_REQUESTS = [
    {
        "id": "lr-001",
        "employee_id": "emp-005",
        "employee_name": "Hoàng Văn B",
        "leave_type": "Nghỉ phép năm",
        "start_date": "2024-06-03",
        "end_date": "2024-06-05",
        "total_days": 3.0,
        "reason": "Việc gia đình",
        "status": "pending",
        "created_at": "2024-06-01T09:00:00",
    },
    {
        "id": "lr-002",
        "employee_id": "emp-006",
        "employee_name": "Nguyễn Thị C",
        "leave_type": "Nghỉ ốm",
        "start_date": "2024-06-07",
        "end_date": "2024-06-07",
        "total_days": 1.0,
        "reason": "Bị cảm, có đơn bác sĩ",
        "status": "approved",
        "created_at": "2024-06-05T08:00:00",
    },
]

# ─────────────────────────────────────────────
# COMMISSION CONFIG
# ─────────────────────────────────────────────
COMMISSION_CONFIG = [
    {"tier_level": 1, "rate_percent": 10.0, "name": "Hoa hồng cấp 1"},
    {"tier_level": 2, "rate_percent": 3.0, "name": "Hoa hồng cấp 2"},
    {"tier_level": 3, "rate_percent": 1.0, "name": "Hoa hồng cấp 3"},
]

# ─────────────────────────────────────────────
# ANALYTICS DATA (Realtime simulation)
# ─────────────────────────────────────────────
def generate_chart_data():
    today = date.today()
    click_data = []
    conversion_data = []
    for i in range(30, -1, -1):
        d = today - timedelta(days=i)
        if d.weekday() < 5:
            clicks = 800 + (i % 7) * 120 + (30 - i) * 15
            conv = int(clicks * (0.058 + (i % 3) * 0.005))
            click_data.append({"date": d.isoformat(), "clicks": clicks, "conversions": conv, "cr": round(conv/clicks*100, 2)})
    return click_data

CHART_DATA = generate_chart_data()

# ─────────────────────────────────────────────
# INTEGRATIONS
# ─────────────────────────────────────────────
INTEGRATIONS = [
    {"id": 1, "name": "PayPal", "type": "payment_gateway", "status": "active", "last_sync": "2024-06-05T10:00:00"},
    {"id": 2, "name": "VNPAY", "type": "payment_gateway", "status": "active", "last_sync": "2024-06-05T10:00:00"},
    {"id": 3, "name": "Máy chấm công ZKTeco", "type": "attendance_device", "status": "active", "last_sync": "2024-06-06T08:05:00"},
    {"id": 4, "name": "AccessTrade Network", "type": "tracking_network", "status": "active", "last_sync": "2024-06-06T09:30:00"},
    {"id": 5, "name": "Admitad Network", "type": "tracking_network", "status": "inactive", "last_sync": None},
]

# In-memory postback log
POSTBACK_LOGS = [
    {"id": 1, "affiliate_code": "AF001", "click_id": "CLK_ABC123", "order_id": "ORD_001", "revenue": 300000, "status": "confirmed", "received_at": "2024-06-06T10:05:00"},
    {"id": 2, "affiliate_code": "AF004", "click_id": "CLK_DEF456", "order_id": "ORD_002", "revenue": 450000, "status": "confirmed", "received_at": "2024-06-06T10:12:00"},
    {"id": 3, "affiliate_code": "AF002", "click_id": "CLK_GHI789", "order_id": "ORD_003", "revenue": 280000, "status": "pending", "received_at": "2024-06-06T10:35:00"},
]
