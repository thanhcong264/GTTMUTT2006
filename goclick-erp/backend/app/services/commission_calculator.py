"""
GoClick ERP – Commission Calculator Service
Multi-tier affiliate commission calculation logic
"""
from typing import List, Dict, Optional
from datetime import date
import uuid

from app.seed_data import AFFILIATES, COMMISSION_CONFIG, AFFILIATE_CONVERSIONS if hasattr(__import__('app.seed_data', fromlist=['AFFILIATE_CONVERSIONS']), 'AFFILIATE_CONVERSIONS') else None


def get_commission_rate(tier_level: int) -> float:
    """Get commission rate for a given tier level."""
    config = next((c for c in COMMISSION_CONFIG if c["tier_level"] == tier_level), None)
    return config["rate_percent"] if config else 0.0


def calculate_affiliate_commission(
    affiliate_id: str,
    period_from: date,
    period_to: date,
    conversions: List[Dict],
) -> Dict:
    """
    Calculate commission for a single affiliate.
    
    Multi-level structure:
    - Tier 1 affiliate: earns 10% on own revenue
    - Tier 2 affiliate (under Tier 1): earns 3% on own revenue
      AND parent Tier 1 affiliate earns bonus 3% on Tier 2's revenue
    
    Returns payout record dict.
    """
    affiliate = next((a for a in AFFILIATES if a["id"] == affiliate_id), None)
    if not affiliate:
        raise ValueError(f"Affiliate {affiliate_id} not found")

    tier_level = affiliate.get("tier_level", 1)
    commission_rate = get_commission_rate(tier_level)

    # Filter conversions for this period
    period_convs = [
        c for c in conversions
        if c.get("affiliate_id") == affiliate_id
        and period_from.isoformat() <= c.get("conversion_date", "") <= period_to.isoformat()
    ]

    total_clicks = sum(c.get("clicks", 1) for c in period_convs)
    total_conversions = len(period_convs)
    gross_revenue = sum(c.get("revenue", 0) for c in period_convs)
    commission_amt = round(gross_revenue * commission_rate / 100, 2)

    # Parent commission (if this affiliate has a parent at tier 1)
    parent_commission_earned = 0.0
    parent_id = affiliate.get("parent_id")
    if parent_id:
        parent = next((a for a in AFFILIATES if a["id"] == parent_id), None)
        if parent and parent.get("tier_level") == 1:
            parent_rate = get_commission_rate(2)  # Parent earns tier-2 rate on child's revenue
            parent_commission_earned = round(gross_revenue * parent_rate / 100, 2)

    return {
        "id": str(uuid.uuid4()),
        "affiliate_id": affiliate_id,
        "affiliate_code": affiliate.get("affiliate_code"),
        "affiliate_name": affiliate.get("full_name"),
        "period_from": period_from.isoformat(),
        "period_to": period_to.isoformat(),
        "tier_level": tier_level,
        "total_clicks": total_clicks,
        "total_conversions": total_conversions,
        "gross_revenue": gross_revenue,
        "commission_rate": commission_rate,
        "commission_amt": commission_amt,
        "parent_commission": parent_commission_earned,
        "net_payable": commission_amt,
        "status": "pending",
        "breakdown": {
            "own_commission": {
                "rate": commission_rate,
                "amount": commission_amt,
                "description": f"Hoa hồng cấp {tier_level}: {commission_rate}% × {gross_revenue:,.0f}đ"
            },
            "parent_bonus": {
                "amount": parent_commission_earned,
                "description": f"Thưởng cấp trên từ doanh thu cấp {tier_level}" if parent_commission_earned > 0 else "Không có"
            }
        }
    }


def run_monthly_commission_batch(period_from: date, period_to: date, conversions: List[Dict]) -> List[Dict]:
    """
    Run commission calculation for ALL active affiliates in a period.
    Returns list of payout records.
    """
    payouts = []
    active_affiliates = [a for a in AFFILIATES if a["status"] == "active"]

    for affiliate in active_affiliates:
        try:
            payout = calculate_affiliate_commission(
                affiliate_id=affiliate["id"],
                period_from=period_from,
                period_to=period_to,
                conversions=conversions,
            )
            if payout["total_conversions"] > 0 or payout["total_clicks"] > 0:
                payouts.append(payout)
        except Exception as e:
            continue  # Log in production

    # Also calculate parent bonuses for tier-1 affiliates from their sub-affiliates
    tier1_affiliates = {a["id"]: a for a in active_affiliates if a.get("tier_level") == 1}
    for payout in payouts:
        aff = next((a for a in AFFILIATES if a["id"] == payout["affiliate_id"]), None)
        if aff and aff.get("parent_id") and aff["parent_id"] in tier1_affiliates:
            # Find parent's payout and add bonus
            parent_payout = next((p for p in payouts if p["affiliate_id"] == aff["parent_id"]), None)
            if parent_payout:
                bonus = payout.get("parent_commission", 0)
                parent_payout["commission_amt"] = round(parent_payout["commission_amt"] + bonus, 2)
                parent_payout["net_payable"] = parent_payout["commission_amt"]

    return payouts


def format_commission_report(payouts: List[Dict]) -> Dict:
    """Format payouts into a summary report."""
    total_commission = sum(p["net_payable"] for p in payouts)
    total_revenue = sum(p["gross_revenue"] for p in payouts)

    return {
        "summary": {
            "total_affiliates": len(payouts),
            "total_revenue": total_revenue,
            "total_commission": total_commission,
            "commission_ratio": round(total_commission / total_revenue * 100, 2) if total_revenue > 0 else 0,
        },
        "by_tier": {
            tier: {
                "count": len([p for p in payouts if p["tier_level"] == tier]),
                "total_commission": sum(p["net_payable"] for p in payouts if p["tier_level"] == tier),
            }
            for tier in [1, 2, 3]
        },
        "payouts": sorted(payouts, key=lambda x: x["net_payable"], reverse=True),
    }
