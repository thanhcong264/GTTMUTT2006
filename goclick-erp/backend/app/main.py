"""
GoClick ERP – FastAPI Main Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.attendance import router as attendance_router
from app.api.affiliate import router as affiliate_router
from app.api.workflow import router as workflow_router
from app.api.reports import router_reports, router_integrations

app = FastAPI(
    title="GoClick ERP API",
    description="Hệ thống ERP Tiếp thị Liên kết & Chấm công",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS – allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth_router)
app.include_router(attendance_router)
app.include_router(affiliate_router)
app.include_router(workflow_router)
app.include_router(router_reports)
app.include_router(router_integrations)


@app.get("/")
async def root():
    return {
        "app": "GoClick ERP",
        "version": "1.0.0",
        "docs": "/api/docs",
        "status": "running",
    }


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "GoClick ERP API"}
