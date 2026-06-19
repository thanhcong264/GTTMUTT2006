"""
GoClick ERP – Reports & Integration API
GET /api/reports/dashboard     – Dashboard KPI stats
GET /api/reports/affiliate     – Affiliate analytics (chart data)
GET /api/reports/attendance    – Attendance analytics
GET /api/integrations          – List integrations
POST /api/integrations/{id}/sync – Trigger sync
POST /api/integrations/webhook – Generic webhook receiver
"""
from fastapi import APIRouter, HTTPException, Header, Query, Request
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta

from app.seed_data import (
    EMPLOYEES, TIMESHEETS, AFFILIATES, PAYOUTS, WORKFLOWS,
    CHART_DATA, INTEGRATIONS
)
from app.api.auth import get_current_user

router_reports = APIRouter(prefix="/api/reports", tags=["Reports"])
router_integrations = APIRouter(prefix="/api/integrations", tags=["Integrations"])


@router_reports.get("/dashboard")
async def dashboard_stats(authorization: Optional[str] = Header(None)):
    """Main dashboard KPI stats."""
    get_current_user(authorization)

    today = date.today().isoformat()
    this_month = date.today().strftime("%Y-%m")

    total_employees = len([e for e in EMPLOYEES if e["status"] == "active"])
    pending_workflows = len([w for w in WORKFLOWS if w["status"] == "pending"])
    active_affiliates = len([a for a in AFFILIATES if a["status"] == "active"])
    total_commission_month = sum(
        p.get("net_payable", 0) for p in PAYOUTS
        if p.get("period_from", "").startswith(this_month[:7])
    )

    # Today's attendance
    today_records = [t for t in TIMESHEETS if t["work_date"] == today]
    checked_in_today = len([t for t in today_records if t.get("check_in_time")])

    return {
        "kpis": [
            {"label": "Tổng nhân viên", "value": total_employees, "unit": "người", "change": +2, "icon": "users"},
            {"label": "Đơn chờ duyệt", "value": pending_workflows, "unit": "đơn", "change": pending_workflows, "icon": "clock"},
            {"label": "Đối tác Active", "value": active_affiliates, "unit": "đối tác", "change": +1, "icon": "handshake"},
            {"label": "Hoa hồng tháng", "value": total_commission_month, "unit": "đ", "change": +12.5, "icon": "trending-up"},
            {"label": "Đã chấm công hôm nay", "value": checked_in_today, "unit": f"/{total_employees}", "change": 0, "icon": "check-circle"},
        ],
        "affiliate_total_revenue": sum(a["total_revenue"] for a in AFFILIATES),
        "affiliate_total_commission": sum(a["total_commission"] for a in AFFILIATES),
    }


@router_reports.get("/affiliate")
async def affiliate_analytics(
    period: Optional[str] = Query("30d"),
    authorization: Optional[str] = Header(None)
):
    """Affiliate click/conversion chart data."""
    get_current_user(authorization)

    days = 30
    if period == "7d":
        days = 7
    elif period == "90d":
        days = 90

    chart = CHART_DATA[-days:] if len(CHART_DATA) >= days else CHART_DATA

    return {
        "chart_data": chart,
        "summary": {
            "total_clicks": sum(d["clicks"] for d in chart),
            "total_conversions": sum(d["conversions"] for d in chart),
            "avg_cr": round(sum(d["cr"] for d in chart) / len(chart), 2) if chart else 0,
        },
        "top_affiliates": sorted(AFFILIATES, key=lambda a: a["total_revenue"], reverse=True)[:5],
    }


@router_reports.get("/attendance")
async def attendance_analytics(
    month: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
):
    """Attendance bar chart data."""
    get_current_user(authorization)
    target = month or date.today().strftime("%Y-%m")
    records = [t for t in TIMESHEETS if t["work_date"].startswith(target)]

    # Group by employee
    from collections import defaultdict
    emp_stats = defaultdict(lambda: {"present": 0, "late": 0, "absent": 0, "half_day": 0, "total_hours": 0})
    for r in records:
        eid = r["employee_id"]
        status = r.get("status", "present")
        emp_stats[eid][status if status in ["present","late","absent","half_day"] else "present"] += 1
        emp_stats[eid]["total_hours"] += r.get("working_hours", 0) or 0

    emp_map = {e["id"]: e["full_name"] for e in EMPLOYEES}
    bar_data = [
        {
            "employee": emp_map.get(eid, "Unknown"),
            "employee_id": eid,
            **stats
        }
        for eid, stats in emp_stats.items()
    ]

    return {"month": target, "bar_data": bar_data}


# ─── INTEGRATIONS ───────────────────────────────────────────────────

@router_integrations.get("")
async def list_integrations(authorization: Optional[str] = Header(None)):
    """List all configured integrations."""
    get_current_user(authorization)
    return {"integrations": INTEGRATIONS}


@router_integrations.post("/{integration_id}/sync")
async def sync_integration(
    integration_id: int,
    authorization: Optional[str] = Header(None)
):
    """Trigger a sync for an integration."""
    current_user = get_current_user(authorization)
    if current_user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Chỉ Admin/HR được phép đồng bộ")

    integration = next((i for i in INTEGRATIONS if i["id"] == integration_id), None)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    from datetime import datetime
    idx = INTEGRATIONS.index(integration)
    INTEGRATIONS[idx]["last_sync"] = datetime.now().isoformat()
    INTEGRATIONS[idx]["status"] = "active"

    return {
        "success": True,
        "integration": INTEGRATIONS[idx],
        "message": f"Đồng bộ {integration['name']} thành công!"
    }


@router_integrations.post("/webhook")
async def receive_webhook(request: Request):
    """Generic webhook receiver endpoint."""
    body = await request.json()
    source = request.headers.get("X-Source", "unknown")
    print(f"[WEBHOOK] Received from {source}: {body}")
    return {"received": True, "source": source}
