"""
GoClick ERP – Workflow API
GET  /api/workflow              – Danh sách requests
POST /api/workflow              – Tạo workflow request
POST /api/workflow/{id}/action  – Thực hiện action (approve/reject)
GET  /api/workflow/leave        – Đơn nghỉ phép
POST /api/workflow/leave        – Tạo đơn nghỉ phép
"""
from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.seed_data import WORKFLOWS, LEAVE_REQUESTS, EMPLOYEES
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/workflow", tags=["Workflow"])


class WorkflowAction(BaseModel):
    action: str  # approve | reject | request_info
    note: Optional[str] = None


class LeaveRequest(BaseModel):
    employee_id: str
    leave_type: str
    start_date: str
    end_date: str
    total_days: float
    reason: Optional[str] = None


@router.get("")
async def list_workflows(
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
):
    """List workflow requests based on role."""
    current_user = get_current_user(authorization)
    results = list(WORKFLOWS)

    role = current_user["role"]
    # Filter by role visibility
    if role == "hr":
        results = [w for w in results if w["type"] == "leave_request"]
    elif role == "affiliate_manager":
        results = [w for w in results if w["type"] in ["leave_request", "payout_approval"]]
    elif role == "accountant":
        results = [w for w in results if w["type"] == "payout_approval"]
    elif role == "employee":
        results = [w for w in results if w["requester_id"] == current_user["id"]]

    if type:
        results = [w for w in results if w["type"] == type]
    if status:
        results = [w for w in results if w["status"] == status]

    return {
        "workflows": results,
        "total": len(results),
        "pending_count": len([w for w in results if w["status"] == "pending"]),
    }


@router.post("/{workflow_id}/action")
async def perform_action(
    workflow_id: str,
    body: WorkflowAction,
    authorization: Optional[str] = Header(None)
):
    """Approve or reject a workflow step."""
    current_user = get_current_user(authorization)
    wf = next((w for w in WORKFLOWS if w["id"] == workflow_id), None)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow request not found")

    if wf["status"] in ["approved", "rejected", "cancelled"]:
        raise HTTPException(status_code=400, detail="Workflow đã hoàn tất, không thể thay đổi")

    # Update current step
    current_step_idx = wf["current_step"] - 1
    if current_step_idx < len(wf["steps"]):
        wf["steps"][current_step_idx]["status"] = body.action if body.action != "approve" else "approved"
        wf["steps"][current_step_idx]["acted_at"] = datetime.now().isoformat()
        wf["steps"][current_step_idx]["note"] = body.note

    if body.action == "reject":
        wf["status"] = "rejected"
    elif body.action == "approve":
        if wf["current_step"] >= wf["total_steps"]:
            wf["status"] = "approved"
        else:
            wf["current_step"] += 1
            wf["status"] = "in_progress"
            # Activate next step
            wf["steps"][wf["current_step"] - 1]["status"] = "pending"
    elif body.action == "request_info":
        wf["steps"][current_step_idx]["status"] = "waiting_info"

    idx = WORKFLOWS.index(wf)
    WORKFLOWS[idx] = wf

    return {"success": True, "workflow": wf}


@router.get("/leave")
async def list_leave_requests(authorization: Optional[str] = Header(None)):
    """Get leave requests."""
    current_user = get_current_user(authorization)
    results = list(LEAVE_REQUESTS)

    if current_user["role"] == "employee":
        results = [r for r in results if r["employee_id"] == current_user["id"]]

    return {"leave_requests": results, "total": len(results)}


@router.post("/leave")
async def create_leave_request(body: LeaveRequest, authorization: Optional[str] = Header(None)):
    """Create a new leave request and trigger workflow."""
    current_user = get_current_user(authorization)

    import uuid
    lr_id = str(uuid.uuid4())
    leave_req = {
        "id": lr_id,
        "employee_id": body.employee_id,
        "employee_name": current_user["full_name"],
        "leave_type": body.leave_type,
        "start_date": body.start_date,
        "end_date": body.end_date,
        "total_days": body.total_days,
        "reason": body.reason,
        "status": "pending",
        "created_at": datetime.now().isoformat(),
    }
    LEAVE_REQUESTS.append(leave_req)

    # Auto-create workflow
    wf_id = str(uuid.uuid4())
    workflow = {
        "id": wf_id,
        "type": "leave_request",
        "title": f"Đơn {body.leave_type} - {current_user['full_name']} ({body.start_date} → {body.end_date})",
        "requester_id": current_user["id"],
        "requester_name": current_user["full_name"],
        "ref_id": lr_id,
        "status": "pending",
        "priority": "normal",
        "current_step": 1,
        "total_steps": 2,
        "created_at": datetime.now().isoformat(),
        "steps": [
            {"step": 1, "name": "Trưởng phòng duyệt", "role": "affiliate_manager", "status": "pending"},
            {"step": 2, "name": "HR ghi nhận", "role": "hr", "status": "waiting"},
        ],
    }
    WORKFLOWS.append(workflow)

    return {
        "success": True,
        "leave_request": leave_req,
        "workflow_id": wf_id,
        "message": "Đơn nghỉ phép đã được tạo và gửi phê duyệt!"
    }
