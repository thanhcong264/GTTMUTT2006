"""
GoClick ERP – Affiliate API
GET  /api/affiliates                      – Danh sách đối tác (RBAC)
GET  /api/affiliates/{id}                 – Chi tiết đối tác
POST /api/affiliates                      – Tạo đối tác mới
PUT  /api/affiliates/{id}/status          – Cập nhật trạng thái
GET  /api/affiliates/{id}/commission      – Xem hoa hồng tích lũy
POST /api/affiliates/calculate-commission – Tính hoa hồng hàng kỳ
POST /api/affiliates/postback             – Nhận postback từ tracking network
GET  /api/affiliates/postback/logs        – Log postback
GET  /api/affiliates/config/commission    – Cấu hình hoa hồng
PUT  /api/affiliates/config/commission    – Cập nhật cấu hình
"""
from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
import uuid

from app.seed_data import AFFILIATES, PAYOUTS, COMMISSION_CONFIG, POSTBACK_LOGS, EMPLOYEES
from app.api.auth import get_current_user
from app.services.commission_calculator import (
    calculate_affiliate_commission,
    run_monthly_commission_batch,
    format_commission_report,
)

router = APIRouter(prefix="/api/affiliates", tags=["Affiliate"])


class AffiliateCreate(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    traffic_source: Optional[str] = None
    tier_level: int = 1
    parent_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None


class PostbackPayload(BaseModel):
    affiliate_code: str
    click_id: str
    order_id: Optional[str] = None
    revenue: float
    currency: str = "VND"
    source_network: Optional[str] = None


class CommissionRequest(BaseModel):
    period_from: str  # YYYY-MM-DD
    period_to: str
    affiliate_ids: Optional[List[str]] = None  # None = all


class CommissionConfigUpdate(BaseModel):
    tier_level: int
    rate_percent: float


@router.get("")
async def list_affiliates(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
):
    """List affiliates with RBAC filtering."""
    current_user = get_current_user(authorization)

    results = list(AFFILIATES)

    # AM can only see affiliates they manage
    if current_user["role"] == "affiliate_manager":
        results = [a for a in results if a.get("manager_id") == current_user["id"]]

    if status:
        results = [a for a in results if a["status"] == status]
    if search:
        s = search.lower()
        results = [a for a in results if
                   s in a["full_name"].lower() or
                   s in a["affiliate_code"].lower() or
                   s in (a.get("email") or "").lower()]

    # Enrich with manager name
    emp_map = {e["id"]: e["full_name"] for e in EMPLOYEES}
    for a in results:
        a["manager_name"] = emp_map.get(a.get("manager_id"), "—")
        # Calculate CR
        if a["total_clicks"] > 0:
            a["conversion_rate"] = round(a["total_conversions"] / a["total_clicks"] * 100, 2)
        else:
            a["conversion_rate"] = 0.0

    return {"affiliates": results, "total": len(results)}


@router.get("/config/commission")
async def get_commission_config(authorization: Optional[str] = Header(None)):
    """Get commission configuration."""
    get_current_user(authorization)
    return {"config": COMMISSION_CONFIG}


@router.put("/config/commission")
async def update_commission_config(
    body: CommissionConfigUpdate,
    authorization: Optional[str] = Header(None)
):
    """Update commission rate for a tier."""
    current_user = get_current_user(authorization)
    if current_user["role"] not in ["admin", "accountant"]:
        raise HTTPException(status_code=403, detail="Chỉ Admin hoặc Kế toán được phép chỉnh sửa cấu hình")

    config = next((c for c in COMMISSION_CONFIG if c["tier_level"] == body.tier_level), None)
    if not config:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy cấu hình cấp {body.tier_level}")

    idx = COMMISSION_CONFIG.index(config)
    COMMISSION_CONFIG[idx]["rate_percent"] = body.rate_percent

    return {"success": True, "config": COMMISSION_CONFIG[idx]}


@router.get("/postback/logs")
async def get_postback_logs(authorization: Optional[str] = Header(None)):
    """Get postback event logs."""
    get_current_user(authorization)
    return {"logs": POSTBACK_LOGS, "total": len(POSTBACK_LOGS)}


@router.post("/postback")
async def receive_postback(body: PostbackPayload):
    """Receive conversion postback from tracking network (no auth for webhook)."""
    affiliate = next((a for a in AFFILIATES if a["affiliate_code"] == body.affiliate_code), None)
    if not affiliate:
        raise HTTPException(status_code=404, detail=f"Affiliate code {body.affiliate_code} not found")

    # Record postback
    log_entry = {
        "id": len(POSTBACK_LOGS) + 1,
        "affiliate_code": body.affiliate_code,
        "affiliate_name": affiliate["full_name"],
        "click_id": body.click_id,
        "order_id": body.order_id,
        "revenue": body.revenue,
        "currency": body.currency,
        "source_network": body.source_network,
        "status": "confirmed",
        "received_at": datetime.now().isoformat(),
    }
    POSTBACK_LOGS.append(log_entry)

    # Update affiliate totals
    idx = AFFILIATES.index(affiliate)
    AFFILIATES[idx]["total_conversions"] += 1
    AFFILIATES[idx]["total_clicks"] += 1
    AFFILIATES[idx]["total_revenue"] += body.revenue
    AFFILIATES[idx]["total_commission"] += body.revenue * 0.10

    return {"success": True, "postback_id": log_entry["id"], "message": "Conversion recorded"}


@router.post("/calculate-commission")
async def calculate_commission(
    body: CommissionRequest,
    authorization: Optional[str] = Header(None)
):
    """Run commission calculation for a period."""
    current_user = get_current_user(authorization)
    if current_user["role"] not in ["admin", "accountant", "affiliate_manager"]:
        raise HTTPException(status_code=403, detail="Không có quyền thực hiện")

    period_from = date.fromisoformat(body.period_from)
    period_to = date.fromisoformat(body.period_to)

    # For demo: generate mock conversions from affiliate totals
    mock_conversions = []
    for aff in AFFILIATES:
        if aff["status"] == "active":
            for i in range(min(aff["total_conversions"] // 10, 30)):
                mock_conversions.append({
                    "affiliate_id": aff["id"],
                    "revenue": aff["total_revenue"] / max(aff["total_conversions"], 1),
                    "clicks": 10,
                    "conversion_date": body.period_from,
                })

    payouts = run_monthly_commission_batch(period_from, period_to, mock_conversions)
    report = format_commission_report(payouts)

    return {
        "success": True,
        "period": {"from": body.period_from, "to": body.period_to},
        "report": report,
    }


@router.get("/{affiliate_id}/commission")
async def get_affiliate_commission(
    affiliate_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get commission history for a specific affiliate."""
    current_user = get_current_user(authorization)
    affiliate = next((a for a in AFFILIATES if a["id"] == affiliate_id), None)
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")

    payouts = [p for p in PAYOUTS if p["affiliate_id"] == affiliate_id]
    return {
        "affiliate": affiliate,
        "payouts": payouts,
        "summary": {
            "total_payouts": len(payouts),
            "total_paid": sum(p["net_payable"] for p in payouts if p["status"] == "paid"),
            "pending": sum(p["net_payable"] for p in payouts if p["status"] in ["pending", "reviewed"]),
        }
    }


@router.get("/{affiliate_id}")
async def get_affiliate(affiliate_id: str, authorization: Optional[str] = Header(None)):
    get_current_user(authorization)
    affiliate = next((a for a in AFFILIATES if a["id"] == affiliate_id), None)
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    return affiliate


@router.post("")
async def create_affiliate(body: AffiliateCreate, authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    if current_user["role"] not in ["admin", "affiliate_manager"]:
        raise HTTPException(status_code=403, detail="Không có quyền tạo đối tác")

    code = f"AF{str(len(AFFILIATES)+1).zfill(3)}"
    new_aff = {
        "id": str(uuid.uuid4()),
        "affiliate_code": code,
        "full_name": body.full_name,
        "email": body.email,
        "phone": body.phone,
        "status": "pending",
        "tier_level": body.tier_level,
        "parent_id": body.parent_id,
        "manager_id": current_user["id"],
        "traffic_source": body.traffic_source,
        "bank_name": body.bank_name,
        "bank_account": body.bank_account,
        "total_clicks": 0,
        "total_conversions": 0,
        "total_revenue": 0,
        "total_commission": 0,
        "joined_at": date.today().isoformat(),
        "created_at": datetime.now().isoformat(),
    }
    AFFILIATES.append(new_aff)
    return {"success": True, "affiliate": new_aff}


@router.put("/{affiliate_id}/status")
async def update_status(
    affiliate_id: str,
    body: StatusUpdate,
    authorization: Optional[str] = Header(None)
):
    current_user = get_current_user(authorization)
    affiliate = next((a for a in AFFILIATES if a["id"] == affiliate_id), None)
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")

    idx = AFFILIATES.index(affiliate)
    AFFILIATES[idx]["status"] = body.status
    return {"success": True, "affiliate": AFFILIATES[idx]}
