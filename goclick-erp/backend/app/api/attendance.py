"""
GoClick ERP – Attendance API
POST /api/attendance/checkin     – GPS check-in
POST /api/attendance/checkout    – GPS check-out
GET  /api/attendance/timesheet   – Get timesheet (calendar view)
POST /api/attendance/sync-device – Simulate fingerprint/face sync
GET  /api/attendance/summary     – Monthly summary stats
"""
from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import uuid

from app.seed_data import TIMESHEETS, EMPLOYEES
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

# Office location (for GPS radius check)
OFFICE_LAT = 10.7769
OFFICE_LNG = 106.7009
MAX_RADIUS_KM = 0.5  # 500 meters


def haversine_distance(lat1, lng1, lat2, lng2) -> float:
    """Calculate distance in km between two GPS coordinates."""
    from math import radians, cos, sin, asin, sqrt
    R = 6371
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlng/2)**2
    return R * 2 * asin(sqrt(a))


class CheckInRequest(BaseModel):
    employee_id: str
    latitude: float
    longitude: float
    note: Optional[str] = None


class CheckOutRequest(BaseModel):
    employee_id: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    note: Optional[str] = None


class DeviceSyncRequest(BaseModel):
    device_id: str
    records: List[dict]  # [{employee_code, check_in, check_out, date}]


@router.post("/checkin")
async def checkin(body: CheckInRequest, authorization: Optional[str] = Header(None)):
    """GPS-based check-in with radius validation."""
    current_user = get_current_user(authorization)

    today = date.today().isoformat()

    # Check if already checked in today
    existing = next((t for t in TIMESHEETS
                     if t["employee_id"] == body.employee_id and t["work_date"] == today), None)
    if existing and existing.get("check_in_time"):
        raise HTTPException(status_code=400, detail="Nhân viên đã chấm công vào ca hôm nay")

    # GPS radius validation
    distance = haversine_distance(body.latitude, body.longitude, OFFICE_LAT, OFFICE_LNG)
    is_in_range = distance <= MAX_RADIUS_KM

    now = datetime.now()
    standard_start = now.replace(hour=8, minute=0, second=0, microsecond=0)
    is_late = now > now.replace(hour=8, minute=15, second=0, microsecond=0)

    record = {
        "id": str(uuid.uuid4()),
        "employee_id": body.employee_id,
        "work_date": today,
        "check_in_time": now.isoformat(),
        "check_out_time": None,
        "check_in_lat": body.latitude,
        "check_in_lng": body.longitude,
        "source": "gps",
        "status": "late" if is_late else "present",
        "working_hours": None,
        "ot_hours": 0,
        "note": body.note,
        "gps_distance_km": round(distance, 3),
        "gps_in_range": is_in_range,
    }

    if existing:
        idx = TIMESHEETS.index(existing)
        TIMESHEETS[idx].update(record)
    else:
        TIMESHEETS.append(record)

    return {
        "success": True,
        "message": "Chấm công thành công!" if is_in_range else "⚠️ Chấm công thành công (ngoài phạm vi văn phòng)",
        "data": record,
        "gps_info": {
            "distance_km": round(distance, 3),
            "in_range": is_in_range,
            "office_lat": OFFICE_LAT,
            "office_lng": OFFICE_LNG,
        }
    }


@router.post("/checkout")
async def checkout(body: CheckOutRequest, authorization: Optional[str] = Header(None)):
    """GPS-based check-out."""
    current_user = get_current_user(authorization)
    today = date.today().isoformat()

    record = next((t for t in TIMESHEETS
                   if t["employee_id"] == body.employee_id and t["work_date"] == today), None)
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi chấm công hôm nay")
    if record.get("check_out_time"):
        raise HTTPException(status_code=400, detail="Đã chấm công ra ca rồi")

    now = datetime.now()
    check_in = datetime.fromisoformat(record["check_in_time"])
    working_hours = round((now - check_in).total_seconds() / 3600, 2)
    ot_hours = max(0, working_hours - 8.0)

    idx = TIMESHEETS.index(record)
    TIMESHEETS[idx].update({
        "check_out_time": now.isoformat(),
        "check_out_lat": body.latitude,
        "check_out_lng": body.longitude,
        "working_hours": working_hours,
        "ot_hours": round(ot_hours, 2),
    })

    return {
        "success": True,
        "message": "Chấm công ra ca thành công!",
        "working_hours": working_hours,
        "ot_hours": round(ot_hours, 2),
    }


@router.get("/timesheet")
async def get_timesheet(
    employee_id: Optional[str] = Query(None),
    month: Optional[str] = Query(None),  # YYYY-MM
    authorization: Optional[str] = Header(None)
):
    """Get timesheet calendar data for a month."""
    current_user = get_current_user(authorization)

    # RBAC: employees can only see their own timesheet
    if current_user["role"] == "employee":
        employee_id = current_user["id"]

    target_month = month or date.today().strftime("%Y-%m")

    records = [
        t for t in TIMESHEETS
        if t["work_date"].startswith(target_month)
        and (not employee_id or t["employee_id"] == employee_id)
    ]

    # Enrich with employee name
    emp_map = {e["id"]: e["full_name"] for e in EMPLOYEES}
    for r in records:
        r["employee_name"] = emp_map.get(r["employee_id"], "Unknown")

    return {"month": target_month, "records": records, "total": len(records)}


@router.post("/sync-device")
async def sync_device(body: DeviceSyncRequest, authorization: Optional[str] = Header(None)):
    """Simulate sync from fingerprint/face recognition machine."""
    current_user = get_current_user(authorization)
    if current_user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Không có quyền đồng bộ máy chấm công")

    synced = 0
    emp_code_map = {e["employee_code"]: e["id"] for e in EMPLOYEES}

    for rec in body.records:
        emp_id = emp_code_map.get(rec.get("employee_code"))
        if not emp_id:
            continue

        work_date = rec.get("date", date.today().isoformat())
        existing = next((t for t in TIMESHEETS
                        if t["employee_id"] == emp_id and t["work_date"] == work_date), None)

        new_rec = {
            "id": str(uuid.uuid4()),
            "employee_id": emp_id,
            "work_date": work_date,
            "check_in_time": rec.get("check_in"),
            "check_out_time": rec.get("check_out"),
            "source": "fingerprint",
            "status": "present",
            "device_id": body.device_id,
            "synced_at": datetime.now().isoformat(),
        }
        if existing:
            idx = TIMESHEETS.index(existing)
            TIMESHEETS[idx].update(new_rec)
        else:
            TIMESHEETS.append(new_rec)
        synced += 1

    return {"success": True, "synced": synced, "device_id": body.device_id}


@router.get("/summary")
async def get_summary(
    employee_id: Optional[str] = Query(None),
    month: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
):
    """Monthly attendance summary stats."""
    current_user = get_current_user(authorization)
    target_month = month or date.today().strftime("%Y-%m")

    records = [t for t in TIMESHEETS if t["work_date"].startswith(target_month)]
    if employee_id:
        records = [r for r in records if r["employee_id"] == employee_id]

    return {
        "month": target_month,
        "total_days": len(records),
        "present": len([r for r in records if r["status"] == "present"]),
        "late": len([r for r in records if r["status"] == "late"]),
        "absent": len([r for r in records if r["status"] == "absent"]),
        "half_day": len([r for r in records if r["status"] == "half_day"]),
        "on_leave": len([r for r in records if r["status"] == "on_leave"]),
        "total_working_hours": sum(r.get("working_hours", 0) or 0 for r in records),
        "total_ot_hours": sum(r.get("ot_hours", 0) or 0 for r in records),
    }
