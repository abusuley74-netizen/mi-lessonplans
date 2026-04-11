"""
ClickPesa Integration Module
This file contains all ClickPesa endpoints that need to be integrated into server.py
"""

from datetime import datetime, timezone, timedelta
import uuid
from fastapi import Request, HTTPException, Depends, Response
from fastapi.responses import JSONResponse, RedirectResponse
import os
import logging

logger = logging.getLogger(__name__)

# ClickPesa configuration
CLICKPESA_API_KEY = os.environ.get('CLICKPESA_API_KEY', 'SKVOuPRdWfxm4Dz1rOCGXSIDEwyYlTqFY9YIr7RCfJ')
CLICKPESA_CLIENT_ID = os.environ.get('CLICKPESA_CLIENT_ID', 'IDf6LaoJzaSyA6F2hwrDOdLJCxfGjjzU')
CLICKPESA_BASE_URL = os.environ.get('CLICKPESA_BASE_URL', 'https://api.clickpesa.com')
CLICKPESA_SANDBOX_URL = os.environ.get('CLICKPESA_SANDBOX_URL', 'https://sandbox.clickpesa.com')
CLICKPESA_USE_SANDBOX = os.environ.get('CLICKPESA_USE_SANDBOX', 'false').lower() in ['true', '1', 'yes']
CLICKPESA_RETURN_URL = os.environ.get('CLICKPESA_RETURN_URL', 'https://mi-lessonplan.site/payment/success')
CLICKPESA_WEBHOOK_URL = os.environ.get('CLICKPESA_WEBHOOK_URL', 'https://mi-lessonplan.site/api/clickpesa/webhook')

# Import ClickPesa service
try:
    # Try relative import first (when loaded as module)
    from .clickpesa_service import clickpesa_service
    print("✅ ClickPesa service imported via relative import")
except ImportError as e1:
    try:
        # Try absolute import (when loaded directly)
        from clickpesa_service import clickpesa_service
        print("✅ ClickPesa service imported via absolute import")
    except ImportError as e2:
        print(f"❌ ClickPesa service import failed: {e1}, {e2}")
        # Create a dummy service if not available
        class DummyClickPesaService:
            async def create_subscription_payment(self, **kwargs):
                return {"checkout_url": "https://clickpesa.com/checkout/test", "order_reference": "test_ref"}
            
            async def create_shared_link_payment(self, **kwargs):
                return {"checkout_url": "https://clickpesa.com/checkout/test", "order_reference": "test_ref"}
            
            async def verify_payment_webhook(self, payload, signature):
                return True
            
            def map_status(self, status):
                return status
        
        clickpesa_service = DummyClickPesaService()
        print("⚠️  Using dummy ClickPesa service for testing")

# ==================== CLICKPESA PAYMENT ROUTES ====================

def setup_clickpesa_routes(api_router, get_current_user, db, get_current_admin, check_admin_permission):
    """Setup all ClickPesa routes - call this function from server.py"""
    
    @api_router.post("/subscription/checkout-clickpesa")
    async def subscription_checkout_clickpesa(request: Request, user = Depends(get_current_user)):
        """Create ClickPesa checkout for subscription"""
        data = await request.json()
        plan_id = data.get("plan_id")
        customer_phone = data.get("customer_phone")
        
        if not customer_phone:
            raise HTTPException(status_code=400, detail="customer_phone is required for USSD-PUSH payments")
        
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
                phone=customer_phone
            )
            
            transaction_doc["transaction_id"] = payment_result.get("order_reference")
            transaction_doc["checkout_url"] = payment_result.get("checkout_link")
            transaction_doc["status"] = payment_result.get("status", "PENDING")
            
        except Exception as e:
            logger.error(f"ClickPesa payment creation failed: {e}")
            raise HTTPException(status_code=500, detail=f"Payment creation failed: {str(e)}")
        
        # Save transaction
        await db.clickpesa_transactions.insert_one(transaction_doc)
        transaction_doc.pop("_id", None)
        
        return {
            "success": True,
            "message": "Hosted checkout payment created",
            "checkout_url": transaction_doc["checkout_url"],
            "order_reference": transaction_doc["transaction_id"],
            "status": transaction_doc["status"],
            "merchant_reference": merchant_reference
        }
    
    @api_router.post("/shared-link/checkout-clickpesa")
    async def shared_link_checkout_clickpesa(request: Request):
        """Create ClickPesa checkout for shared link purchase (no auth required)"""
        data = await request.json()
        link_code = data.get("link_code")
        email = data.get("email")
        name = data.get("name", "Customer")
        customer_phone = data.get("customer_phone")  # Phone number for hosted checkout
        
        if not link_code or not email:
            raise HTTPException(status_code=400, detail="link_code and email required")
        
        # Get shared link
        link = await db.shared_links.find_one({"link_code": link_code}, {"_id": 0})
        if not link:
            raise HTTPException(status_code=404, detail="Shared link not found")
        
        if not link.get("is_paid", False):
            raise HTTPException(status_code=400, detail="This link is not a paid link")
        
        price = link.get("price", 0)
        if price <= 0:
            raise HTTPException(status_code=400, detail="Invalid price")
        
        merchant_reference = f"shared_{link_code}_{uuid.uuid4().hex[:12]}"
        
        # Create transaction record
        transaction_doc = {
            "transaction_id": None,
            "merchant_reference": merchant_reference,
            "user_id": None,  # No user ID for shared link purchases
            "email": email,
            "customer_phone": customer_phone,
            "plan_id": "shared_link",
            "link_code": link_code,
            "amount": price,
            "currency": "TZS",
            "status": "pending",
            "description": f"Purchase: {link.get('title', 'Shared Resource')}",
            "checkout_url": None,
            "webhook_traces": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Create ClickPesa payment
        try:
            payment_result = await clickpesa_service.create_shared_link_payment(
                link_code=link_code,
                title=link.get("title", "Shared Resource"),
                price=price,
                customer_email=email,
                customer_name=name,
                customer_phone=customer_phone,
                teacher_id=link.get("teacher_id", "")
            )
            
            transaction_doc["transaction_id"] = payment_result.get("order_reference")
            transaction_doc["checkout_url"] = payment_result.get("checkout_link")
            transaction_doc["status"] = payment_result.get("status", "PENDING")
            
        except Exception as e:
            logger.error(f"ClickPesa shared link payment failed: {e}")
            raise HTTPException(status_code=500, detail=f"Payment creation failed: {str(e)}")
        
        # Save transaction
        await db.clickpesa_transactions.insert_one(transaction_doc)
        transaction_doc.pop("_id", None)
        
        return {
            "success": True,
            "message": "Hosted checkout payment created",
            "checkout_url": transaction_doc["checkout_url"],
            "order_reference": transaction_doc["transaction_id"],
            "status": transaction_doc["status"],
            "merchant_reference": merchant_reference
        }
    
    @api_router.post("/clickpesa/webhook")
    async def clickpesa_webhook(request: Request):
        """Handle ClickPesa webhook notifications for payment status updates"""
        # IP whitelist for ClickPesa webhooks
        CLICKPESA_WHITELIST_IPS = ["104.198.214.223"]
        
        # Get client IP
        client_ip = request.client.host if request.client else None
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        # Check IP whitelist
        if client_ip not in CLICKPESA_WHITELIST_IPS:
            logger.warning(f"Blocked ClickPesa webhook from unauthorized IP: {client_ip}")
            raise HTTPException(status_code=403, detail="Unauthorized IP address")
        
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
            
            logger.info(f"Received ClickPesa webhook from IP: {client_ip}")
            
            # Extract webhook data - ClickPesa format has event and data fields
            event_type = payload.get("event")
            data = payload.get("data", {})
            
            # Extract data from the nested data object
            order_reference = data.get("orderReference")
            transaction_id = data.get("id") or data.get("paymentReference")
            status = data.get("status")
            amount = data.get("collectedAmount") or data.get("amount")
            currency = data.get("collectedCurrency") or data.get("currency")
            channel = data.get("channel")
            message = data.get("message")
            
            if not order_reference:
                # Try to find order reference in root (backward compatibility)
                order_reference = payload.get("orderReference")
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
    
    @api_router.get("/clickpesa/transactions")
    async def get_clickpesa_transactions(user = Depends(get_current_user)):
        """Get ClickPesa transactions for current user"""
        transactions = await db.clickpesa_transactions.find(
            {"user_id": user.user_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        
        return {"transactions": transactions}
    
    @api_router.get("/admin/clickpesa/transactions")
    async def admin_get_clickpesa_transactions(current_admin = Depends(get_current_admin)):
        """Admin: Get all ClickPesa transactions"""
        if not check_admin_permission(current_admin, "subscription_management"):
            raise HTTPException(status_code=403, detail="No permission")
        
        transactions = await db.clickpesa_transactions.find(
            {}, {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return {"transactions": transactions}
    
    # ==================== PAYOUT ENDPOINTS ====================
    
    @api_router.get("/admin/clickpesa/balance")
    async def admin_get_clickpesa_balance(current_admin = Depends(get_current_admin)):
        """Admin: Get ClickPesa account balance"""
        if not check_admin_permission(current_admin, "subscription_management"):
            raise HTTPException(status_code=403, detail="No permission")
        
        try:
            balance_data = await clickpesa_service.get_account_balance()
            return balance_data
        except Exception as e:
            logger.error(f"Failed to get ClickPesa balance: {e}")
            raise HTTPException(status_code=500, detail="Failed to retrieve account balance")
    
    @api_router.post("/admin/clickpesa/payouts/create")
    async def admin_create_clickpesa_payout(request: Request, current_admin = Depends(get_current_admin)):
        """Admin: Create mobile money payout to customer"""
        if not check_admin_permission(current_admin, "subscription_management"):
            raise HTTPException(status_code=403, detail="No permission")
        
        try:
            data = await request.json()
            amount = data.get("amount")
            phone_number = data.get("phone_number")
            currency = data.get("currency", "TZS")
            order_reference = data.get("order_reference")
            description = data.get("description", "")
            
            if not all([amount, phone_number, order_reference]):
                raise HTTPException(status_code=400, detail="amount, phone_number, and order_reference are required")
            
            # Create payout
            payout_result = await clickpesa_service.create_mobile_money_payout(
                amount=float(amount),
                phone_number=phone_number,
                currency=currency,
                order_reference=order_reference
            )
            
            # Record payout in database
            payout_record = {
                "payout_id": payout_result.get("payout_id"),
                "order_reference": order_reference,
                "amount": amount,
                "currency": currency,
                "phone_number": phone_number,
                "description": description,
                "status": payout_result.get("status", "AUTHORIZED"),
                "fee": payout_result.get("fee"),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "created_by": current_admin.get("email", "admin"),
                "response_data": payout_result
            }
            
            await db.clickpesa_payouts.insert_one(payout_record)
            payout_record.pop("_id", None)
            
            return {
                "success": True,
                "message": "Payout initiated successfully",
                "payout": payout_record
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to create payout: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create payout: {str(e)}")
    
    @api_router.get("/admin/clickpesa/payouts")
    async def admin_get_clickpesa_payouts(current_admin = Depends(get_current_admin)):
        """Admin: Get all ClickPesa payouts"""
        if not check_admin_permission(current_admin, "subscription_management"):
            raise HTTPException(status_code=403, detail="No permission")
        
        payouts = await db.clickpesa_payouts.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return {"payouts": payouts}
    
    @api_router.get("/admin/clickpesa/payouts/{order_reference}")
    async def admin_get_clickpesa_payout_status(order_reference: str, current_admin = Depends(get_current_admin)):
        """Admin: Get payout status by order reference"""
        if not check_admin_permission(current_admin, "subscription_management"):
            raise HTTPException(status_code=403, detail="No permission")
        
        try:
            # Check database first
            payout = await db.clickpesa_payouts.find_one(
                {"order_reference": order_reference},
                {"_id": 0}
            )
            
            if not payout:
                raise HTTPException(status_code=404, detail="Payout not found")
            
            # Get latest status from ClickPesa
            status_data = await clickpesa_service.check_payout_status(order_reference)
            
            # Update database if status changed
            if status_data.get("success") and status_data.get("status") != payout.get("status"):
                await db.clickpesa_payouts.update_one(
                    {"order_reference": order_reference},
                    {
                        "$set": {
                            "status": status_data.get("status"),
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                            "latest_status_check": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                payout["status"] = status_data.get("status")
            
            return {
                "payout": payout,
                "status_check": status_data
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get payout status: {e}")
            raise HTTPException(status_code=500, detail="Failed to retrieve payout status")
    
    return {
        "subscription_checkout_clickpesa": subscription_checkout_clickpesa,
        "shared_link_checkout_clickpesa": shared_link_checkout_clickpesa,
        "clickpesa_webhook": clickpesa_webhook,
        "get_clickpesa_transactions": get_clickpesa_transactions,
        "admin_get_clickpesa_transactions": admin_get_clickpesa_transactions,
        "admin_get_clickpesa_balance": admin_get_clickpesa_balance,
        "admin_create_clickpesa_payout": admin_create_clickpesa_payout,
        "admin_get_clickpesa_payouts": admin_get_clickpesa_payouts,
        "admin_get_clickpesa_payout_status": admin_get_clickpesa_payout_status
    }
