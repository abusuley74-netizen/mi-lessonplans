# ClickPesa Integration Guide for MiLesson Plan

## Overview
This guide explains how to integrate ClickPesa as the payment gateway to replace PesaPal. The integration supports two payment flows:
1. **Direct Customer Subscriptions**: Users paying for subscription plans (Basic, Premium, Master)
2. **Third-party Product Purchases**: External users buying products via shared links

## Files Created

### 1. `/app/backend/clickpesa_service.py`
- ClickPesa API client service
- Handles authentication and API calls
- Creates checkout links for payments
- Processes webhook notifications

### 2. `/app/backend/clickpesa_endpoints.py`
- API endpoints for ClickPesa integration
- Subscription checkout endpoint
- Shared link payment endpoint
- Webhook handler
- Admin transaction management

### 3. `/app/CLICKPESA_INTEGRATION_PLAN.md`
- Comprehensive integration plan
- Architecture design
- Implementation steps

## Integration Steps

### Step 1: Update Environment Variables
Add these to your `.env` file:

```bash
# ClickPesa Configuration
CLICKPESA_API_KEY=SKVOuPRdWfxm4Dz1rOCGXSIDEwyYlTqFY9YIr7RCfJ
CLICKPESA_CLIENT_ID=IDf6LaoJzaSyA6F2hwrDOdLJCxfGjjzU
CLICKPESA_BASE_URL=https://api.clickpesa.com
CLICKPESA_SANDBOX_URL=https://sandbox.clickpesa.com
CLICKPESA_USE_SANDBOX=false
CLICKPESA_RETURN_URL=https://mi-lessonplan.site/payment/success
CLICKPESA_WEBHOOK_URL=https://mi-lessonplan.site/api/clickpesa/webhook
```

### Step 2: Update server.py

Add ClickPesa configuration after PesaPal configuration (around line 29):

```python
# ClickPesa configuration
CLICKPESA_API_KEY = os.environ.get('CLICKPESA_API_KEY', 'SKVOuPRdWfxm4Dz1rOCGXSIDEwyYlTqFY9YIr7RCfJ')
CLICKPESA_CLIENT_ID = os.environ.get('CLICKPESA_CLIENT_ID', 'IDf6LaoJzaSyA6F2hwrDOdLJCxfGjjzU')
CLICKPESA_BASE_URL = os.environ.get('CLICKPESA_BASE_URL', 'https://api.clickpesa.com')
CLICKPESA_SANDBOX_URL = os.environ.get('CLICKPESA_SANDBOX_URL', 'https://sandbox.clickpesa.com')
CLICKPESA_USE_SANDBOX = os.environ.get('CLICKPESA_USE_SANDBOX', 'false').lower() in ['true', '1', 'yes']
CLICKPESA_RETURN_URL = os.environ.get('CLICKPESA_RETURN_URL', 'https://mi-lessonplan.site/payment/success')
CLICKPESA_WEBHOOK_URL = os.environ.get('CLICKPESA_WEBHOOK_URL', '')
```

Add ClickPesa import at the top of server.py:

```python
from .clickpesa_service import clickpesa_service
```

### Step 3: Add ClickPesa Endpoints to server.py

Add these endpoints to the appropriate sections in server.py:

#### A. Subscription Payment Endpoint
Add this after the existing `/api/subscription/checkout` endpoint:

```python
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
```

#### B. Shared Link Payment Endpoint
Add this after the existing shared links endpoints:

```python
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
```

#### C. Payment Success Callback
Add this endpoint:

```python
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
```

#### D. Webhook Handler
Add this endpoint:

```python
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
```

### Step 4: Update Frontend Components

#### A. Update PaymentSettings.js
Replace PesaPal checkout with ClickPesa checkout:

```javascript
// In the checkout function
const handleCheckout = async (planId) => {
  try {
    const response = await fetch('/api/subscription/checkout-clickpesa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId })
    });
    
    const data = await response.json();
    if (data.checkout_url) {
      window.location.href = data.checkout_url;
    }
  } catch (error) {
    console.error('Checkout error:', error);
  }
};
```

#### B. Update SharedView.js
Replace mock payment with ClickPesa payment:

```javascript
// In the payment handler
const handlePayment = async () => {
  try {
    const response = await fetch(`/api/links/${linkCode}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customerEmail,
        name: customerName,
        phone: customerPhone
      })
    });
    
    const data = await response.json();
    if (data.checkout_url) {
      window.location.href = data.checkout_url;
    }
  } catch (error) {
    console.error('Payment error:', error);
  }
};
```

### Step 5: Database Schema Updates

Create the `clickpesa_transactions` collection with this schema:

```javascript
{
  transaction_id: String, // ClickPesa order_reference
  merchant_reference: String, // Our reference
  user_id: String, // Optional for third-party purchases
  email: String,
  plan_id: String, // "basic", "premium", "master" or "shared_link"
  link_code: String, // For shared link purchases
  amount: Number,
  currency: String, // "TZS"
  status: String, // "pending", "completed", "failed", "cancelled"
  description: