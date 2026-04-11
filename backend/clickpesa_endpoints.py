 """
ClickPesa Endpoints Implementation
To be integrated into server.py
"""

from datetime import datetime, timezone, timedelta
import uuid
from fastapi import Request, HTTPException, Depends, Response
from fastapi.responses import JSONResponse, RedirectResponse
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
    
    # Create transaction record
    transaction_doc = {
        "transaction_id": None,  # Will use order_reference as transaction ID
        "merchant_reference": merchant_reference,
        "user_id": user.user_id,
        "email": user.email,
        "plan_id": plan_id,
        "link_code": None,
        "amount": amount,
        "currency": "TZS",
        "status": "pending",
        "description": f"MiLessonPlan {plan_id.title()} subscription",
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
            merchant_reference=merchant_reference,
            phone=data.get("phone", "")
        )
        
        if not payment_result.get("success"):
            raise HTTPException(status_code=502, detail="Failed to create payment")
        
        # Update transaction with ClickPesa details
        transaction_doc["transaction_id"] = payment_result.get("order_reference")
        transaction_doc["checkout_url"] = payment_result.get("checkout_link")
        transaction_doc["client_id"] = payment_result.get("client_id")
        
        # Save to database
        await db.clickpesa_transactions.insert_one(transaction_doc)
        
        return {
            "message": "ClickPesa checkout created",
            "checkout_url": payment_result["checkout_link"],
            "merchant_reference": merchant_reference,
            "order_reference": payment_result.get("order_reference")
        }
        
    except Exception as e:
        logger.error(f"ClickPesa checkout error: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Payment service error")


@api_router.post("/links/{code}/payment")
async def create_shared_link_payment(code: str, request: Request):
    """Create ClickPesa payment for shared link"""
    data = await request.json()
    customer_email = data.get("email")
    customer_name = data.get("name", "")
    customer_phone = data.get("phone", "")
    
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
            customer_phone=customer_phone,
            teacher_id=link.get("teacher_id")
        )
        
        if not payment_result.get("success"):
            raise HTTPException(status_code=502, detail="Failed to create payment")
        
        # Create transaction record
        transaction_doc = {
            "transaction_id": payment_result.get("order_reference"),
            "merchant_reference": payment_result.get("order_reference"),
            "user_id": None,  # Third-party user
            "email": customer_email,
            "plan_id": "shared_link",
            "link_code": code,
            "amount": price,
            "currency": "TZS",
            "status": "pending",
            "description": f"Purchase: {link.get('title')}",
            "checkout_url": payment_result.get("checkout_link"),
            "client_id": payment_result.get("client_id"),
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
                "payment_transaction_id": payment_result.get("order_reference"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "message": "Payment created",
            "checkout_url": payment_result["checkout_link"],
            "order_reference": payment_result.get("order_reference")
        }
        
    except Exception as e:
        logger.error(f"Shared link payment error: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Payment service error")


@api_router.get("/payment/success")
async def payment_success_callback(request: Request):
    """Handle user redirect after successful payment"""
    # Extract parameters from query string
    order_reference = request.query_params.get("orderReference")
    status = request.query_params.get("status")
    transaction_id = request.query_params.get("transactionId")
    
    if not order_reference:
        # If no order reference, show generic success page
        return RedirectResponse(url="/dashboard?payment=success")
    
    # Get transaction
    transaction = await db.clickpesa_transactions.find_one(
        {"transaction_id": order_reference},
        {"_id": 0}
    )
    
    if not transaction:
        # Try merchant_reference as fallback
        transaction = await db.clickpesa_transactions.find_one(
            {"merchant_reference": order_reference},
            {"_id": 0}
        )
    
    if not transaction:
        # Transaction not found, show generic success
        return RedirectResponse(url="/dashboard?payment=success")
    
    # Update transaction status if status provided
    if status:
        await db.clickpesa_transactions.update_one(
            {"transaction_id": order_reference},
            {"$set": {
                "status": clickpesa_service.map_status(status),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    # Redirect based on transaction type
    if transaction.get("plan_id") == "shared_link":
        link_code = transaction.get("link_code")
        return RedirectResponse(url=f"/shared/{link_code}?payment=success")
    else:
        # Subscription payment
        return RedirectResponse(url="/dashboard?payment=success&plan=upgraded")


@api_router.post("/clickpesa/webhook")
async def clickpesa_webhook(request: Request):
    """Handle ClickPesa webhook notifications for payment status updates"""
    try:
        # Get webhook payload
        payload = await request.json()
        signature = request.headers.get("X-ClickPesa-Signature") or request.headers.get("X-Signature")
        
        # Verify webhook signature if signature is provided
        if signature:
            is_valid = await clickpesa_service.verify_payment_webhook(payload, signature)
            if not is_valid:
                logger.warning(f"Invalid webhook signature: {signature}")
                raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Extract webhook data
        event_type = payload.get("event")
        order_reference = payload.get("orderReference")
        transaction_id = payload.get("transactionId")
        status = payload.get("status")
        amount = payload.get("amount")
        currency = payload.get("currency")
        
        if not order_reference:
            raise HTTPException(status_code=400, detail="Missing order reference")
        
        # Log webhook
        webhook_trace = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "status": status,
            "payload": payload
        }
        
        # Find transaction by order_reference (which is our transaction_id)
        transaction = await db.clickpesa_transactions.find_one(
            {"transaction_id": order_reference},
            {"_id": 0}
        )
        
        if not transaction:
            # Try to find by merchant_reference
            transaction = await db.clickpesa_transactions.find_one(
                {"merchant_reference": order_reference},
                {"_id": 0}
            )
        
        if not transaction:
            logger.warning(f"Webhook for unknown transaction: {order_reference}")
            return JSONResponse({"status": "ok", "message": "Transaction not found"})
        
        # Update transaction
        update_data = {
            "status": clickpesa_service.map_status(status),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if transaction_id:
            update_data["clickpesa_transaction_id"] = transaction_id
        
        await db.clickpesa_transactions.update_one(
            {"transaction_id": order_reference},
            {
                "$set": update_data,
                "$push": {"webhook_traces": webhook_trace}
            }
        )
        
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
                
                # TODO: Notify teacher of sale
                # Could send email or in-app notification
                
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
        # Try merchant_reference as fallback
        transaction = await db.clickpesa_transactions.find_one(
            {"merchant_reference": transaction_id},
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
    
    # Get revenue by month
    monthly_revenue = await db.clickpesa_transactions.aggregate([
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m", "date": {"$toDate": "$created_at"}}},
            "revenue": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]).to_list(None)
    
    return {
        "plan_revenue": plan_revenue,
        "success_rate": round(success_rate, 2),
        "total_transactions": total_transactions,
        "completed_transactions": completed_transactions,
        "monthly_revenue": monthly_revenue
    }