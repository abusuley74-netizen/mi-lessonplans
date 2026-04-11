# ClickPesa Integration Plan

## Overview
Replace PesaPal with ClickPesa as the payment gateway for MiLesson Plan. Two payment flows need to be supported:
1. **Direct Customer Subscriptions**: Users paying for subscription plans (Basic, Premium, Master)
2. **Third-party Product Purchases**: External users buying products via shared links

## Current Architecture Analysis

### PesaPal Implementation
- **Authentication**: OAuth1 with consumer key/secret
- **Checkout Flow**: 
  - `POST /api/subscription/checkout` creates PesaPal checkout URL
  - User redirected to PesaPal payment page
  - PesaPal sends IPN to `/api/pesapal/ipn`
- **Database**: `pesapal_transactions` collection tracks payments
- **Frontend**: `PaymentSettings.js` and `PesaPalTransactionManager.js`

### Shared Links Implementation
- **Current State**: Mock payment system in `SharedView.js`
- **Database**: `shared_links` collection has `is_paid` and `price` fields
- **Need**: Real payment integration for third-party users

## ClickPesa Integration Requirements

### 1. Environment Configuration
```
CLICKPESA_API_KEY=your_api_key
CLICKPESA_API_SECRET=your_api_secret
CLICKPESA_BASE_URL=https://api.clickpesa.com (sandbox: https://sandbox.clickpesa.com)
CLICKPESA_CALLBACK_URL=https://yourdomain.com/api/clickpesa/callback
CLICKPESA_WEBHOOK_URL=https://yourdomain.com/api/clickpesa/webhook
CLICKPESA_USE_SANDBOX=true/false
```

### 2. Database Schema Updates
```javascript
// New collection: clickpesa_transactions
{
  transaction_id: String, // ClickPesa transaction ID
  merchant_reference: String, // Our reference: user_plan_uuid or link_code
  user_id: String, // Optional for third-party purchases
  email: String,
  plan_id: String, // "basic", "premium", "master" or "shared_link"
  link_code: String, // For shared link purchases
  amount: Number,
  currency: String, // "TZS"
  status: String, // "pending", "completed", "failed", "cancelled"
  description: String,
  checkout_url: String,
  webhook_traces: Array, // Track webhook calls
  created_at: ISODate,
  updated_at: ISODate
}

// Update shared_links collection
{
  // Add payment tracking fields
  payment_status: String, // "unpaid", "pending", "paid", "failed"
  payment_transaction_id: String, // Reference to clickpesa_transactions
  paid_at: ISODate
}
```

### 3. Backend Implementation

#### A. Subscription Payment Flow
1. **Create Checkout Endpoint** (`POST /api/subscription/checkout-clickpesa`)
   - Validate plan selection
   - Create ClickPesa payment request
   - Store transaction in `clickpesa_transactions`
   - Return checkout URL

2. **Payment Callback Endpoint** (`GET /api/clickpesa/callback`)
   - Handle user redirect after payment
   - Update transaction status
   - Activate subscription if successful

3. **Webhook Endpoint** (`POST /api/clickpesa/webhook`)
   - Process payment status updates from ClickPesa
   - Update transaction and user subscription
   - Handle referral commissions

#### B. Shared Link Payment Flow
1. **Create Payment Endpoint** (`POST /api/links/{code}/payment`)
   - Check if link is paid
   - Create ClickPesa payment for shared resource
   - Return payment URL to frontend

2. **Payment Success Handler**
   - Update shared link payment status
   - Allow download access
   - Track revenue for teacher

#### C. Admin Endpoints
1. **Transaction Management** (`GET /api/admin/clickpesa/transactions`)
2. **Analytics** (`GET /api/admin/clickpesa/analytics`)
3. **Transaction Details** (`GET /api/admin/clickpesa/transactions/{id}`)

### 4. Frontend Implementation

#### A. PaymentSettings.js Updates
- Replace PesaPal references with ClickPesa
- Update checkout flow to use new endpoint
- Update payment info component

#### B. New Shared Link Payment Component
- Create payment modal for shared links
- Integrate ClickPesa checkout
- Handle payment success/failure

#### C. PesaPalTransactionManager.js → ClickPesaTransactionManager.js
- Rename and update to use ClickPesa endpoints
- Update status badges and analytics

#### D. SharedView.js Updates
- Replace mock payment with real ClickPesa integration
- Add payment flow for paid links

### 5. ClickPesa Service Module
Create `/app/backend/clickpesa_service.py` with:
- ClickPesa API client
- Payment request creation
- Webhook signature verification
- Status mapping utilities

### 6. Migration Strategy
1. **Phase 1**: Implement ClickPesa alongside PesaPal (dual support)
2. **Phase 2**: Migrate existing users to ClickPesa
3. **Phase 3**: Remove PesaPal code after successful migration

## API Endpoints to Implement

### Backend Endpoints
```
POST   /api/subscription/checkout-clickpesa    # Create ClickPesa checkout
GET    /api/clickpesa/callback                 # Payment callback
POST   /api/clickpesa/webhook                  # Webhook handler
POST   /api/links/{code}/payment               # Create shared link payment
GET    /api/admin/clickpesa/transactions       # List transactions
GET    /api/admin/clickpesa/analytics          # Get analytics
GET    /api/admin/clickpesa/transactions/{id}  # Transaction details
```

### Frontend Components
- `ClickPesaPaymentButton.js` - Reusable payment button
- `SharedLinkPaymentModal.js` - Payment modal for shared links
- `ClickPesaTransactionManager.js` - Admin transaction manager

## Testing Plan
1. **Sandbox Testing**: Test with ClickPesa sandbox environment
2. **Subscription Flow**: Test plan purchases and subscription activation
3. **Shared Link Flow**: Test paid shared link purchases
4. **Webhook Testing**: Test payment status updates
5. **Admin Interface**: Test transaction management

## Security Considerations
1. **Webhook Verification**: Verify ClickPesa webhook signatures
2. **API Key Security**: Store credentials in environment variables
3. **Input Validation**: Validate all payment data
4. **Idempotency**: Handle duplicate webhook calls
5. **Error Logging**: Comprehensive error tracking

## Timeline
1. **Week 1**: Research ClickPesa API, set up sandbox, implement core service
2. **Week 2**: Implement subscription payment flow
3. **Week 3**: Implement shared link payment flow
4. **Week 4**: Update frontend components, testing, deployment

## Dependencies
1. ClickPesa API documentation
2. ClickPesa sandbox credentials
3. Updated environment configuration
4. Database migration scripts

## Success Metrics
1. Successful subscription payments via ClickPesa
2. Successful shared link purchases
3. Accurate transaction tracking
4. Proper webhook processing
5. Admin dashboard functionality