# PesaPal Payment Integration

This document outlines the PesaPal payment integration for MiLesson Plan subscriptions.

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the `backend/` directory:

```bash
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=milessonplan

# PesaPal Configuration
PESAPAL_CONSUMER_KEY=Sp9V76FmwL0dS4qAaVcL7PoIuH/gkInm
PESAPAL_CONSUMER_SECRET=ukStYbZKDpjgb6Rgk/AP2bFuy8I=
PESAPAL_CALLBACK_URL=https://Mi-LessonPlan.site/listentowebsitepaymentsipn.php
PESAPAL_USE_SANDBOX=true

# Application Configuration
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### 2. Sandbox vs Production

- **Sandbox**: `PESAPAL_USE_SANDBOX=true` (cybqa.pesapal.com)
- **Production**: `PESAPAL_USE_SANDBOX=false` (www.pesapal.com)

## 💳 Payment Flow

### User Subscription Process

1. User selects plan (Basic/Premium/Enterprise)
2. Frontend calls `POST /api/subscription/checkout`
3. Backend creates transaction record in `pesapal_transactions` collection
4. Backend calls PesaPal API to get checkout URL
5. User is redirected to PesaPal payment page
6. User completes payment
7. PesaPal sends IPN to `/api/pesapal/ipn` or `/listentowebsitepaymentsipn.php`
8. Backend processes IPN and activates subscription
9. Referral commission is updated automatically

### Transaction Statuses

Valid PesaPal transaction statuses:
- `PENDING` - Payment initiated
- `COMPLETED` - Payment successful
- `FAILED` - Payment failed
- `CANCELLED` - Payment cancelled
- `VALID` - Alternative success status
- `INVALID` - Payment invalid

## 📊 Admin Dashboard

### PesaPal Transaction Manager

Access via: Admin Dashboard → Subscription Management

Features:
- **Transaction List**: View all PesaPal transactions with filtering
- **Status Summary**: Overview of transaction statuses and amounts
- **Analytics**: Revenue trends, success rates, plan performance
- **Transaction Details**: Individual transaction view with IPN traces
- **Pagination**: Handle large transaction volumes

### API Endpoints

```bash
# Get transactions with filtering
GET /api/admin/pesapal/transactions?status=COMPLETED&limit=50&skip=0

# Get transaction details
GET /api/admin/pesapal/transactions/{merchant_reference}

# Get payment analytics
GET /api/admin/pesapal/analytics
```

## 🔄 Subscription Renewal

### Automatic Renewal

Subscriptions are renewed monthly via cron job. The system:

1. Finds expired subscriptions
2. Extends expiry by 30 days
3. Updates referral commissions
4. Logs all activities

### Manual Renewal

Super admins can trigger renewal manually:

```bash
POST /api/admin/cron/renew-subscriptions
```

### Cron Job Setup

Run the renewal script monthly:

```bash
# Manual execution
python cron_renew_subscriptions.py

# Cron job (Linux/Mac)
0 0 1 * * /path/to/python /path/to/cron_renew_subscriptions.py

# Windows Task Scheduler
# Create task to run monthly on the 1st
```

## 🛠️ Testing

### Sandbox Testing

1. Set `PESAPAL_USE_SANDBOX=true`
2. Use test credentials provided
3. Test payments with PesaPal sandbox environment
4. Verify IPN processing and subscription activation

### Test Cards

Use PesaPal sandbox test cards for testing payments.

## 📋 Database Schema

### PesaPal Transactions Collection

```javascript
{
  merchant_reference: "user123_basic_abc123",
  user_id: "user123",
  email: "user@example.com",
  plan_id: "basic", // basic, premium, enterprise
  amount: 9999,
  currency: "TZS",
  status: "COMPLETED",
  pesapal_tracking_id: "123456789",
  ipn_traces: [
    {
      timestamp: "2024-01-15T10:30:00Z",
      status: "COMPLETED",
      ip_address: "192.168.1.1",
      user_agent: "PesaPal/1.0"
    }
  ],
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:30:00Z"
}
```

### Updated User Collection

```javascript
{
  user_id: "user123",
  subscription_status: "active",
  subscription_plan: "basic",
  subscription_expires: "2024-02-15T10:00:00Z"
}
```

## 🔐 Security Features

- **IPN Validation**: Validates transaction statuses and merchant references
- **IPN Tracing**: Logs all IPN calls for audit trails
- **Admin Permissions**: Restricted access to payment data
- **HTTPS Required**: All PesaPal communications use HTTPS

## 🚨 Troubleshooting

### Common Issues

1. **IPN Not Processing**
   - Check PesaPal IPN URL configuration
   - Verify webhook endpoint is accessible
   - Check server logs for IPN processing errors

2. **Payments Not Completing**
   - Verify PesaPal credentials
   - Check sandbox vs production settings
   - Confirm callback URL is correct

3. **Subscription Not Activating**
   - Check transaction status in database
   - Verify IPN was received and processed
   - Check user subscription fields

### Logs

- **Application Logs**: Check `server.py` logs for payment processing
- **IPN Logs**: Check `ipn_traces` in transaction records
- **Cron Logs**: Check `subscription_renewal.log` for renewal activities

## 📞 Support

For PesaPal integration issues:
1. Check PesaPal merchant dashboard
2. Review transaction logs in admin panel
3. Verify environment configuration
4. Test with sandbox environment first

## 🔄 Migration Notes

If upgrading from previous payment system:

1. Backup existing subscription data
2. Run migration script to create `pesapal_transactions` collection
3. Update PesaPal credentials in environment
4. Test payment flow with small amounts
5. Monitor IPN processing for first few transactions