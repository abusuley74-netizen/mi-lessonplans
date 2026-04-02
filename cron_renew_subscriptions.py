#!/usr/bin/env python3
"""
MiLesson Plan Subscription Renewal Cron Job
Run this script monthly to renew subscriptions and update referral commissions.

Usage:
- Manual run: python cron_renew_subscriptions.py
- Cron job: Add to crontab for monthly execution
  0 0 1 * * /path/to/python /path/to/cron_renew_subscriptions.py

Environment Variables Required:
- MONGO_URL: MongoDB connection string
- DB_NAME: Database name
"""

import os
import sys
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('subscription_renewal.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'milessonplan')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

async def update_referral_commission(referral_id: str, plan_id: str, months: int):
    """Update referral commission (copied from server.py)"""
    plan_prices = {
        "basic": 9999,
        "premium": 19999,
        "enterprise": 29999
    }

    price = plan_prices.get(plan_id, 0)
    commission_rate = 0.3  # 30%
    commission = price * months * commission_rate

    # Get current referral
    referral = await db.referrals.find_one({"referral_id": referral_id})
    if not referral:
        return

    current_commission = referral.get("total_commission", 0)
    new_commission = current_commission + commission

    await db.referrals.update_one(
        {"referral_id": referral_id},
        {
            "$set": {
                "total_commission": new_commission,
                "active_months": referral.get("active_months", 0) + months,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )

async def process_subscription_renewals():
    """Process monthly subscription renewals"""
    logger.info("Starting monthly subscription renewal process")

    # Find all active subscriptions that expire today or have expired
    today = datetime.now(timezone.utc).date()
    expired_subscriptions = await db.users.find(
        {
            "subscription_status": "active",
            "subscription_expires": {"$exists": True}
        },
        {"_id": 0}
    ).to_list(1000)

    renewed_count = 0

    for user in expired_subscriptions:
        try:
            expires_str = user.get("subscription_expires")
            if not expires_str:
                continue

            # Parse expiry date
            if isinstance(expires_str, str):
                expires_date = datetime.fromisoformat(expires_str.replace('Z', '+00:00'))
            else:
                expires_date = expires_str

            if expires_date.tzinfo is None:
                expires_date = expires_date.replace(tzinfo=timezone.utc)

            # Check if subscription has expired or expires today
            if expires_date.date() <= today:
                plan_id = user.get("subscription_plan", "free")
                if plan_id == "free":
                    continue  # Free plans don't renew

                # Extend subscription by 30 days
                new_expiry = datetime.now(timezone.utc) + timedelta(days=30)

                await db.users.update_one(
                    {"user_id": user["user_id"]},
                    {"$set": {"subscription_expires": new_expiry.isoformat()}}
                )

                # Update referral commission for another month
                referral = await db.referrals.find_one({"teacher_id": user["user_id"]}, {"_id": 0})
                if referral:
                    await update_referral_commission(referral["referral_id"], plan_id, 1)

                renewed_count += 1
                logger.info(f"Renewed subscription for user {user['user_id']}, plan {plan_id}")

        except Exception as e:
            logger.error(f"Error renewing subscription for user {user['user_id']}: {str(e)}")
            continue

    logger.info(f"Subscription renewal process completed. {renewed_count} subscriptions renewed.")
    return renewed_count

async def main():
    """Main cron job function"""
    try:
        logger.info("=== Starting MiLesson Plan Subscription Renewal Cron Job ===")

        renewed_count = await process_subscription_renewals()

        logger.info(f"=== Cron job completed successfully. Renewed {renewed_count} subscriptions ===")

    except Exception as e:
        logger.error(f"Cron job failed: {str(e)}")
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())