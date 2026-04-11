"""
ClickPesa Endpoints Template
To be integrated into server.py
"""

from datetime import datetime, timezone, timedelta
import uuid
from fastapi import Request, HTTPException, Depends
from .clickpesa_service import clickpesa_service

# ==================== CLICKPESA PAYMENT ROUTES ====================

@api_router.post("/subscription/checkout-clickpesa")
async def subscription_checkout_clickpesa(request: Request, user: User = Depends(get_current_user)):
    """Create ClickPesa checkout for subscription"""
    data = await request.json()
    plan_id = data.get("plan_id")
    
    plan_prices = {"basic": 9999, "premium": 19999, "master": 29999}
    if plan_id not in plan_prices:
        raise HTTPException(status_code=400, detail="Invalid plan selected")
    
    amount = plan_prices[plan_id]
    merchant_reference = f"{user.user_id}_{plan_id}_{uuid.uuid4().hex[:12]}"
    description = f"MiLessonPlan {plan_id.title()} subscription for {user.email}"
    
    # Create transaction record
    transaction_doc = {
        "transaction_id": None,  # Will be filled after ClickPesa response
        "merchant_reference": merchant_reference,
        "user_id": user.user_id,
        "email": user.email,
        "plan_id": plan_id,
        "link_code": None,
        "amount": amount,
        "currency": "TZS",
        "status": "pending",
        "description": description,
        "checkout_url": None,
        "webhook_traces": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Create ClickPesa payment
    try:
        payment_result = await clickpesa_service.create_subscription_payment(
            user_id=user.user_id,
            email=user.email,
            name=user.name,
            plan_id=plan_id,
            merchant_reference=merchant_reference
        )
        
        if not payment_result.get("success"):
            raise HTTPException(status_code=502, detail="Failed to create payment")
        
        # Update transaction with ClickPesa details
        transaction_doc["transaction_id"] = payment_result.get("transaction_id")
        transaction_doc["checkout_url"] = payment_result.get("payment_url")
        transaction_doc["status"] = payment_result.get("status", "pending")
        
        # Save to database
        await db.clickpesa_transactions.insert_one(transaction_doc)
        
        return {
            "message": "ClickPesa checkout created",
            "checkout_url": payment_result["payment_url"],
            "merchant_reference": merchant_reference,
            "transaction_id": payment_result.get("transaction_id")
        }
        
    except Exception as e:
        logger.error(f"ClickPesa checkout error: {e}")
        raise HTTPException(status_code=500, detail="Payment service error")


@api_router.post("/links/{code}/payment")
async def create_shared_link_payment(code: str, request: Request):
    """Create ClickPesa payment for shared link"""
    data = await request.json()
    customer_email = data.get("email")
    customer_name = data.get("name", "")
    
    if not customer_email:
        raise HTTPException(status_code=400, detail="Email required")
    
    # Get shared link
    link = await db.shared_links.find_one({"link_code": code}, {"_id": 0})
    if not link:
        raise HTTPException(status_code=404, detail="Shared link not found")
    
    if not link.get("is_paid"):
        raise HTTPException(status_code=400, detail="This link is not a paid resource")
    
    if link.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="This link has already been purchased")
    
    price = link.get("price", 0)
    if price <= 0:
        raise HTTPException(status_code=400, detail="Invalid price")
    
    # Create ClickPesa payment
    try:
        payment_result = await clickpesa_service.create_shared_link_payment(
            link_code=code,
            title=link.get("title", "Shared Resource"),
            price=price,
            customer_email=customer_email,
            customer_name=customer_name,
            teacher_id=link.get("teacher_id")
        )
        
        if not payment_result.get("success"):
            raise HTTPException(status_code=502, detail="Failed to create payment")
        
        # Create transaction record
        transaction_doc = {
            "transaction_id": payment_result.get("transaction_id"),
            "merchant_reference": payment_result.get("reference"),
            "user_id": None,  # Third-party user
            "email": customer_email,
            "plan_id": "shared_link",
            "link_code": code,
            "amount": price,
            "currency": "TZS",
            "status": payment_result.get("status", "pending"),
            "description": f"Purchase: {link.get('title')}",
            "checkout_url": payment_result.get("payment_url"),
            "webhook_traces": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.clickpesa_transactions.insert_one(transaction_doc)
        
        # Update shared link payment status
        await db.shared_links.update_one(
            {"link_code": code},
            {"$set": {
                "payment_status": "pending",
                "payment_transaction_id": payment_result.get("transaction_id"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "message": "Payment created",
            "payment_url": payment_result["payment_url"],
            "transaction_id": payment_result.get("transaction_id")
        }
        
    except Exception as e:
        logger.error(f"Shared link payment error: {e}")
        raise HTTPException(status_code=500, detail="Payment service error")


@api_router.get("/clickpesa/callback")
async def clickpesa_callback(request: Request):
    """Handle user redirect after payment"""
    # TODO: Implement based on ClickPesa callback parameters
    transaction_id = request.query_params.get("transaction_id")
    status = request.query_params.get("status")
    reference = request.query_params.get("reference")
    
    if not transaction_id:
        raise HTTPException(status_code=400, detail="Missing transaction ID")
    
    # Get transaction
    transaction = await db.clickpesa_transactions.find_one(
        {"transaction_id": transaction_id},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Redirect to appropriate page based on transaction type
    if transaction.get("plan_id") == "shared_link":
        # Redirect to shared link page
        link_code = transaction.get("link_code")
        return RedirectResponse(url=f"/shared/{link_code}")
    else:
        # Redirect to subscription success page
        return RedirectResponse(url="/payment/success")


@api_router.post("/clickpesa/webhook")
async def clickpesa_webhook(request: Request):
    """Handle ClickPesa webhook notifications"""
    # TODO: Implement based on ClickPesa webhook format
    try:
        payload = await request.json()
        signature = request.headers.get("X-ClickPesa-Signature")
        
        # Verify signature
        if not clickpesa_service.verify_webhook_signature(payload, signature):
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Extract webhook data
        event_type = payload.get("event")
        transaction_id = payload.get("transaction_id")
        status = payload.get("status")
        reference = payload.get("reference")
        
        if not transaction_id:
            raise HTTPException(status_code=400, detail="Missing transaction ID")
        
        # Log webhook
        webhook_trace = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "status": status,
            "payload": payload
        }
        
        # Update transaction
        await db.clickpesa_transactions.update_one(
            {"transaction_id": transaction_id},
            {
                "$set": {
                    "status": status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                },
                "$push": {"webhook_traces": webhook_trace}
            }
        )
        
        # Get transaction details
        transaction = await db.clickpesa_transactions.find_one(
            {"transaction_id": transaction_id},
            {"_id": 0}
        )
        
        if not transaction:
            return JSONResponse({"status": "ok", "message": "Transaction not found"})
        
        # Handle successful payment
        if status in ["completed", "success"]:
            if transaction.get("plan_id") == "shared_link":
                # Update shared link as paid
                await db.shared_links.update_one(
                    {"link_code": transaction.get("link_code")},
                    {"$set": {
                        "payment_status": "paid",
                        "paid_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
            else:
                # Activate subscription
                expires = datetime.now(timezone.utc) + timedelta(days=30)
                await db.users.update_one(
                    {"user_id": transaction["user_id"]},
                    {"$set": {
                        "subscription_status": "active",
                        "subscription_plan": transaction["plan_id"],
                        "subscription_expires": expires.isoformat()
                    }}
                )
                
                # Handle referral commission
                user_doc = await db.users.find_one(
                    {"user_id": transaction["user_id"]},
                    {"_id": 0}
                )
                referred_by = user_doc.get("referred_by") if user_doc else None
                if referred_by:
                    plan_prices = {"basic": 9999, "premium": 19999, "master": 29999}
                    price = plan_prices.get(transaction["plan_id"], 0)
                    if price > 0:
                        await db.referral_commissions.insert_one({
                            "commission_id": f"comm_{uuid.uuid4().hex[:12]}",
                            "referrer_id": referred_by,
                            "referee_id": transaction["user_id"],
                            "plan": transaction["plan_id"],
                            "plan_price": price,
                            "commission_amount": round(price * 0.3),
                            "created_at": datetime.now(timezone.utc).isoformat(),
                        })
        
        return JSONResponse({"status": "ok", "message": "Webhook processed"})
        
    except Exception as e:
        logger.error(f"ClickPesa webhook error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing error")


# ==================== CLICKPESA ADMIN ROUTES ====================

@api_router.get("/admin/clickpesa/transactions")
async def get_clickpesa_transactions(request: Request, current_admin: Admin = Depends(get_current_admin)):
    """Get ClickPesa transactions with filtering"""
    if not check_admin_permission(current_admin, "subscription_management"):
        raise HTTPException(status_code=403, detail="No permission")
    
    status_filter = request.query_params.get("status")
    limit = int(request.query_params.get("limit", 50))
    skip = int(request.query_params.get("skip", 0))
    
    query = {}
    if status_filter:
        query["status"] = status_filter.upper()
    
    transactions = await db.clickpesa_transactions.find(
        query, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total_count = await db.clickpesa_transactions.count_documents(query)
    
    summary = await db.clickpesa_transactions.aggregate([
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1},
            "total_amount": {"$sum": "$amount"}
        }}
    ]).to_list(None)
    
    status_summary = {
        item["_id"]: {
            "count": item["count"],
            "total_amount": item["total_amount"]
        }
        for item in summary
    }
    
    return {
        "transactions": transactions,
        "total_count": total_count,
        "status_summary": status_summary,
        "pagination": {
            "skip": skip,
            "limit": limit,
            "has_more": total_count > skip + limit
        }
    }


@api_router.get("/admin/clickpesa/transactions/{transaction_id}")
async def get_clickpesa_transaction_details(transaction_id: str, current_admin: Admin = Depends(get_current_admin)):
    """Get ClickPesa transaction details"""
    if not check_admin_permission(current_admin, "subscription_management"):
        raise HTTPException(status_code=403, detail="No permission")
    
    transaction = await db.clickpesa_transactions.find_one(
        {"transaction_id": transaction_id},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    user = None
    if transaction.get("user_id"):
        user = await db.users.find_one(
            {"user_id": transaction["user_id"]},
            {"_id": 0, "user_id": 1, "email": 1, "name": 1, "subscription_status": 1, "subscription_plan": 1}
        )
    
    return {"transaction": transaction, "user": user}


@api_router.get("/admin/clickpesa/analytics")
async def get_clickpesa_analytics(current_admin: Admin = Depends(get_current_admin)):
    """Get ClickPesa payment analytics"""
    if not check_admin_permission(current_admin, "analytics"):
        raise HTTPException(status_code=403, detail="No permission")
    
    plan_revenue = await db.clickpesa_transactions.aggregate([
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": "$plan_id",
            "total_revenue": {"$sum": "$amount"},
            "transaction_count": {"$sum": 1}
        }}
    ]).to_list(None)
    
    total_transactions = await db.clickpesa_transactions.count_documents({})
    completed_transactions = await db.clickpesa_transactions.count_documents({"status": "completed"})
    
    success_rate = (completed_transactions / total_transactions * 100) if total_transactions > 0 else 0
    
    return {
        "plan_revenue": plan_revenue,
        "success_rate": round(success_rate, 2),
        "total_transactions": total_transactions,
        "completed_transactions": completed_transactions
    }