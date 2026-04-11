"""
ClickPesa Payment Service
Integration with ClickPesa payment gateway for MiLesson Plan
"""

import os
import logging
import hmac
import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# ClickPesa Configuration
CLICKPESA_API_KEY = os.environ.get("CLICKPESA_API_KEY", "SKVOuPRdWfxm4Dz1rOCGXSIDEwyYlTqFY9YIr7RCfJ")
CLICKPESA_CLIENT_ID = os.environ.get("CLICKPESA_CLIENT_ID", "IDf6LaoJzaSyA6F2hwrDOdLJCxfGjjzU")
CLICKPESA_BASE_URL = os.environ.get("CLICKPESA_BASE_URL", "https://api.clickpesa.com")
CLICKPESA_SANDBOX_URL = os.environ.get("CLICKPESA_SANDBOX_URL", "https://sandbox.clickpesa.com")
CLICKPESA_USE_SANDBOX = os.environ.get("CLICKPESA_USE_SANDBOX", "false").lower() in ["true", "1", "yes"]
CLICKPESA_RETURN_URL = os.environ.get("CLICKPESA_RETURN_URL", "https://mi-lessonplan.site/payment/success")
CLICKPESA_WEBHOOK_URL = os.environ.get("CLICKPESA_WEBHOOK_URL", "https://mi-lessonplan.site/api/clickpesa/webhook")

# Determine base URL
BASE_URL = CLICKPESA_SANDBOX_URL if CLICKPESA_USE_SANDBOX else CLICKPESA_BASE_URL

# Payment status mapping (based on common ClickPesa statuses)
CLICKPESA_STATUS_MAP = {
    "pending": "pending",
    "processing": "pending",
    "completed": "completed",
    "success": "completed",
    "failed": "failed",
    "cancelled": "cancelled",
    "expired": "failed"
}

# Plan prices (in TZS)
PLAN_PRICES = {
    "basic": 9999,
    "premium": 19999,
    "master": 29999
}


class ClickPesaService:
    """Service for interacting with ClickPesa API"""
    
    def __init__(self):
        self.api_key = CLICKPESA_API_KEY
        self.client_id = CLICKPESA_CLIENT_ID
        self.base_url = BASE_URL
        self.return_url = CLICKPESA_RETURN_URL
        self.webhook_url = CLICKPESA_WEBHOOK_URL
        
        if not self.api_key:
            logger.warning("ClickPesa API key not configured")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get HTTP headers for ClickPesa API requests"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    def _generate_checksum(self, payload: Dict[str, Any]) -> str:
        """
        Generate checksum for ClickPesa payload according to ClickPesa documentation.
        Algorithm: HMAC-SHA256 with recursive canonicalization
        Secret key: CHKXdouv7DBjsVs2CFQCMCxMBIzJU1MZwDr
        """
        checksum_secret = os.environ.get("CLICKPESA_CHECKSUM_SECRET", "CHKXdouv7DBjsVs2CFQCMCxMBIzJU1MZwDr")
        
        try:
            # Remove checksum and checksumMethod fields if present (as per documentation)
            payload_for_checksum = {k: v for k, v in payload.items() if k not in ["checksum", "checksumMethod"]}
            
            # Recursive canonicalization function (sort keys at all nesting levels)
            def canonicalize(obj):
                if obj is None or not isinstance(obj, dict):
                    return obj
                if isinstance(obj, list):
                    return [canonicalize(item) for item in obj]
                
                # Sort keys and recursively canonicalize values
                sorted_dict = {}
                for key in sorted(obj.keys()):
                    sorted_dict[key] = canonicalize(obj[key])
                return sorted_dict
            
            # Canonicalize the payload recursively
            canonical_payload = canonicalize(payload_for_checksum)
            
            # Serialize to compact JSON (no extra whitespace)
            payload_str = json.dumps(canonical_payload, separators=(',', ':'))
            
            # Generate HMAC-SHA256 with checksum secret as key
            hmac_digest = hmac.new(
                checksum_secret.encode('utf-8'),
                payload_str.encode('utf-8'),
                hashlib.sha256
            ).digest()
            
            # Convert to hex string (lowercase as per documentation examples)
            checksum = hmac_digest.hex()
            
            logger.debug(f"Generated checksum: {checksum[:32]}... (from secret: {checksum_secret[:10]}...)")
            return checksum
            
        except Exception as e:
            logger.error(f"Checksum generation failed: {e}")
            # Fallback to simple method if recursive canonicalization fails
            try:
                # Simple method: sort top-level keys only
                payload_str = json.dumps(payload, sort_keys=True)
                hmac_digest = hmac.new(
                    checksum_secret.encode('utf-8'),
                    payload_str.encode('utf-8'),
                    hashlib.sha256
                ).digest()
                return hmac_digest.hex()
            except:
                return checksum_secret
    
    async def _get_auth_token(self) -> str:
        """
        Generate JWT authorization token for ClickPesa API
        
        Returns:
            JWT token string
        """
        endpoint = f"{self.base_url}/third-parties/generate-token"
        
        headers = {
            "api-key": self.api_key,
            "client-id": self.client_id,
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(endpoint, headers=headers, timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("token"):
                        token = data.get("token")
                        return token
                    else:
                        logger.error(f"ClickPesa token generation failed - no token in response: {data}")
                        raise HTTPException(
                            status_code=502,
                            detail="Failed to generate payment authorization token"
                        )
                else:
                    logger.error(f"ClickPesa token error: {response.status_code} - {response.text}")
                    
                    # Check for specific errors
                    error_text = response.text.lower()
                    if "collection_api" in error_text:
                        raise HTTPException(
                            status_code=403,
                            detail="Application has no access to COLLECTION_API. Please contact ClickPesa support to enable this permission for your application."
                        )
                    elif "unauthorized" in error_text or "invalid" in error_text:
                        raise HTTPException(
                            status_code=401,
                            detail="Invalid ClickPesa credentials. Please check your Client ID and API Key."
                        )
                    else:
                        raise HTTPException(
                            status_code=502,
                            detail=f"Payment authorization failed: {response.status_code}"
                        )
                    
        except httpx.RequestError as e:
            logger.error(f"ClickPesa token request failed: {e}")
            raise HTTPException(
                status_code=503,
                detail="Payment service temporarily unavailable"
            )
    
    async def create_ussd_push_payment(
        self,
        amount: str,
        order_reference: str,
        currency: str,
        phone_number: str,
        customer_name: str = "",
        customer_email: str = "",
        checksum: str = ""
    ) -> Dict[str, Any]:
        """
        Create USSD-PUSH payment request with ClickPesa
        
        Args:
            amount: Payment amount as string (e.g., "9999")
            order_reference: Unique reference for this order
            currency: Currency code (e.g., "TZS")
            phone_number: Customer phone number (format: 255712345678)
            customer_name: Customer name (optional)
            customer_email: Customer email (optional)
            checksum: Checksum if enabled (optional)
        
        Returns:
            Dict containing payment details and status
        """
        # First, get authorization token
        auth_token = await self._get_auth_token()
        
        # USSD-PUSH endpoint from documentation
        endpoint = f"{self.base_url}/third-parties/payments/initiate-ussd-push-request"
        
        payload = {
            "amount": amount,
            "currency": currency,
            "orderReference": order_reference,
            "phoneNumber": phone_number
        }
        
        # Generate checksum if not provided
        if not checksum:
            checksum = self._generate_checksum(payload)
        
        payload["checksum"] = checksum
        
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    endpoint,
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "payment_id": data.get("id"),
                        "status": data.get("status", "PROCESSING"),
                        "order_reference": order_reference,
                        "channel": data.get("channel"),
                        "created_at": data.get("createdAt"),
                        "response_data": data
                    }
                else:
                    logger.error(f"ClickPesa USSD-PUSH error: {response.status_code} - {response.text}")
                    
                    # Check if it's the COLLECTION_API error
                    error_text = response.text.lower()
                    if "collection_api" in error_text:
                        raise HTTPException(
                            status_code=403,
                            detail="Application has no access to COLLECTION_API. Please contact ClickPesa support to enable this permission for your application."
                        )
                    else:
                        raise HTTPException(
                            status_code=502,
                            detail=f"USSD-PUSH payment failed: {response.status_code}"
                        )
                    
        except httpx.RequestError as e:
            logger.error(f"ClickPesa USSD-PUSH request failed: {e}")
            raise HTTPException(
                status_code=503,
                detail="Payment service temporarily unavailable"
            )
    
    async def create_hosted_checkout_payment(
        self,
        amount: str,
        order_reference: str,
        currency: str,
        customer_email: str,
        customer_phone: str,
        customer_name: str = "",
        description: str = "",
        return_url: str = ""
    ) -> Dict[str, Any]:
        """
        Create hosted checkout payment request with ClickPesa
        
        Args:
            amount: Payment amount as string (e.g., "9999")
            order_reference: Unique reference for this order
            currency: Currency code (e.g., "TZS")
            customer_email: Customer email (required)
            customer_phone: Customer phone number (format: 255712345678)
            customer_name: Customer name (optional)
            description: Payment description (optional)
            return_url: Return URL after payment (optional)
        
        Returns:
            Dict containing checkout URL and payment details
        """
        # First, get authorization token
        auth_token = await self._get_auth_token()
        
        # Hosted checkout endpoint
        endpoint = f"{self.base_url}/third-parties/checkout-link/generate-checkout-url"
        
        # Prepare payload for hosted checkout
        payload = {
            "totalPrice": str(amount),
            "orderReference": order_reference,
            "orderCurrency": currency,
            "customerName": customer_name or customer_email.split('@')[0],
            "customerEmail": customer_email,
            "customerPhone": customer_phone,
            "description": description or f"Payment for Order {order_reference}"
        }
        
        # Add return URL if provided
        if return_url:
            payload["returnUrl"] = return_url
        elif self.return_url:
            payload["returnUrl"] = self.return_url
        
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    endpoint,
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    checkout_link = data.get("checkoutLink")
                    
                    if not checkout_link:
                        logger.error(f"No checkout link in response: {data}")
                        raise HTTPException(
                            status_code=502,
                            detail="Payment service returned no checkout link"
                        )
                    
                    return {
                        "success": True,
                        "checkout_link": checkout_link,
                        "order_reference": order_reference,
                        "status": "PENDING",
                        "response_data": data
                    }
                else:
                    logger.error(f"ClickPesa hosted checkout error: {response.status_code} - {response.text}")
                    
                    # Check if it's the COLLECTION_API error
                    error_text = response.text.lower()
                    if "collection_api" in error_text:
                        raise HTTPException(
                            status_code=403,
                            detail="Application has no access to COLLECTION_API. Please contact ClickPesa support to enable this permission for your application."
                        )
                    elif "unauthorized" in error_text or "invalid" in error_text:
                        raise HTTPException(
                            status_code=401,
                            detail="Invalid ClickPesa credentials. Please check your Client ID and API Key."
                        )
                    else:
                        raise HTTPException(
                            status_code=502,
                            detail=f"Hosted checkout payment failed: {response.status_code}"
                        )
                    
        except httpx.RequestError as e:
            logger.error(f"ClickPesa hosted checkout request failed: {e}")
            raise HTTPException(
                status_code=503,
                detail="Payment service temporarily unavailable"
            )
    
    async def check_payment_status(self, order_reference: str) -> Dict[str, Any]:
        """
        Check payment status using order reference
        
        Args:
            order_reference: Unique order reference
        
        Returns:
            Dict containing payment status and details
        """
        auth_token = await self._get_auth_token()
        
        endpoint = f"{self.base_url}/third-parties/payments/{order_reference}"
        
        headers = {
            "Authorization": auth_token,
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(endpoint, headers=headers, timeout=30.0)
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list) and len(data) > 0:
                        payment = data[0]
                        return {
                            "success": True,
                            "status": payment.get("status"),
                            "payment_reference": payment.get("paymentReference"),
                            "order_reference": order_reference,
                            "amount": payment.get("collectedAmount"),
                            "currency": payment.get("collectedCurrency"),
                            "customer": payment.get("customer", {}),
                            "created_at": payment.get("createdAt"),
                            "updated_at": payment.get("updatedAt")
                        }
                    else:
                        return {
                            "success": False,
                            "status": "NOT_FOUND",
                            "order_reference": order_reference
                        }
                else:
                    logger.error(f"ClickPesa status check error: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "status": "ERROR",
                        "order_reference": order_reference,
                        "error": f"Status check failed: {response.status_code}"
                    }
                    
        except httpx.RequestError as e:
            logger.error(f"ClickPesa status check failed: {e}")
            return {
                "success": False,
                "status": "ERROR",
                "order_reference": order_reference,
                "error": "Payment service temporarily unavailable"
            }
    
    async def get_account_balance(self) -> Dict[str, Any]:
        """
        Get ClickPesa account balance
        
        Returns:
            Dict containing account balances by currency
        """
        auth_token = await self._get_auth_token()
        
        endpoint = f"{self.base_url}/third-parties/account/balance"
        
        headers = {
            "Authorization": auth_token,
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(endpoint, headers=headers, timeout=30.0)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "balances": data,
                        "total_tzs": sum(item.get("balance", 0) for item in data if item.get("currency") == "TZS"),
                        "total_usd": sum(item.get("balance", 0) for item in data if item.get("currency") == "USD")
                    }
                else:
                    logger.error(f"ClickPesa balance error: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"Balance check failed: {response.status_code}"
                    }
                    
        except httpx.RequestError as e:
            logger.error(f"ClickPesa balance check failed: {e}")
            return {
                "success": False,
                "error": "Payment service temporarily unavailable"
            }
    
    async def create_mobile_money_payout(
        self,
        amount: float,
        phone_number: str,
        currency: str,
        order_reference: str,
        checksum: str = ""
    ) -> Dict[str, Any]:
        """
        Create mobile money payout to customer
        
        Args:
            amount: Payout amount
            phone_number: Customer phone number (format: 255712345678)
            currency: Currency code (TZS or USD)
            order_reference: Unique reference for this payout
            checksum: Checksum if enabled (optional)
        
        Returns:
            Dict containing payout details and status
        """
        auth_token = await self._get_auth_token()
        
        # Step 1: Preview payout
        preview_endpoint = f"{self.base_url}/third-parties/payouts/preview-mobile-money-payout"
        
        preview_payload = {
            "amount": amount,
            "phoneNumber": phone_number,
            "currency": currency,
            "orderReference": order_reference
        }
        
        if checksum:
            preview_payload["checksum"] = checksum
        
        preview_headers = {
            "Authorization": auth_token,
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                # Step 1: Preview payout
                preview_response = await client.post(
                    preview_endpoint,
                    json=preview_payload,
                    headers=preview_headers,
                    timeout=30.0
                )
                
                if preview_response.status_code != 200:
                    logger.error(f"ClickPesa payout preview error: {preview_response.status_code} - {preview_response.text}")
                    raise HTTPException(
                        status_code=502,
                        detail=f"Payout validation failed: {preview_response.status_code}"
                    )
                
                preview_data = preview_response.json()
                
                # Step 2: Create payout
                create_endpoint = f"{self.base_url}/third-parties/payouts/create-mobile-money-payout"
                
                create_payload = {
                    "amount": amount,
                    "phoneNumber": phone_number,
                    "currency": currency,
                    "orderReference": order_reference
                }
                
                if checksum:
                    create_payload["checksum"] = checksum
                
                create_response = await client.post(
                    create_endpoint,
                    json=create_payload,
                    headers=preview_headers,
                    timeout=30.0
                )
                
                if create_response.status_code == 200:
                    data = create_response.json()
                    return {
                        "success": True,
                        "payout_id": data.get("id"),
                        "order_reference": order_reference,
                        "amount": data.get("amount"),
                        "currency": data.get("currency"),
                        "fee": data.get("fee"),
                        "status": data.get("status", "AUTHORIZED"),
                        "created_at": data.get("createdAt"),
                        "updated_at": data.get("updatedAt"),
                        "preview_data": preview_data
                    }
                else:
                    logger.error(f"ClickPesa payout creation error: {create_response.status_code} - {create_response.text}")
                    raise HTTPException(
                        status_code=502,
                        detail=f"Payout creation failed: {create_response.status_code}"
                    )
                    
        except httpx.RequestError as e:
            logger.error(f"ClickPesa payout request failed: {e}")
            raise HTTPException(
                status_code=503,
                detail="Payout service temporarily unavailable"
            )
    
    async def check_payout_status(self, order_reference: str) -> Dict[str, Any]:
        """
        Check payout status using order reference
        
        Args:
            order_reference: Unique payout order reference
        
        Returns:
            Dict containing payout status and details
        """
        auth_token = await self._get_auth_token()
        
        endpoint = f"{self.base_url}/third-parties/payouts/{order_reference}"
        
        headers = {
            "Authorization": auth_token,
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(endpoint, headers=headers, timeout=30.0)
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list) and len(data) > 0:
                        payout = data[0]
                        return {
                            "success": True,
                            "status": payout.get("status"),
                            "order_reference": order_reference,
                            "amount": payout.get("amount"),
                            "currency": payout.get("currency"),
                            "fee": payout.get("fee"),
                            "channel": payout.get("channel"),
                            "channel_provider": payout.get("channelProvider"),
                            "beneficiary": payout.get("beneficiary", {}),
                            "created_at": payout.get("createdAt"),
                            "updated_at": payout.get("updatedAt")
                        }
                    else:
                        return {
                            "success": False,
                            "status": "NOT_FOUND",
                            "order_reference": order_reference
                        }
                else:
                    logger.error(f"ClickPesa payout status error: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "status": "ERROR",
                        "order_reference": order_reference,
                        "error": f"Payout status check failed: {response.status_code}"
                    }
                    
        except httpx.RequestError as e:
            logger.error(f"ClickPesa payout status check failed: {e}")
            return {
                "success": False,
                "status": "ERROR",
                "order_reference": order_reference,
                "error": "Payout service temporarily unavailable"
            }
    
    async def create_subscription_payment(
        self,
        user_id: str,
        email: str,
        name: str,
        plan_id: str,
        merchant_reference: str,
        phone: str = ""
    ) -> Dict[str, Any]:
        """
        Create hosted checkout payment for subscription plan
        
        Args:
            user_id: User ID
            email: User email
            name: User name
            plan_id: Plan ID (basic, premium, master)
            merchant_reference: Unique reference
            phone: User phone (optional for hosted checkout, format: 255712345678)
        
        Returns:
            Dict containing checkout URL and payment details
        """
        if plan_id not in PLAN_PRICES:
            raise HTTPException(status_code=400, detail="Invalid plan ID")
        
        amount = PLAN_PRICES[plan_id]
        
        return await self.create_hosted_checkout_payment(
            amount=str(amount),
            order_reference=merchant_reference,
            currency="TZS",
            customer_email=email,
            customer_phone=phone,
            customer_name=name,
            description=f"MiLessonPlan {plan_id.title()} subscription"
        )
    
    async def create_shared_link_payment(
        self,
        link_code: str,
        title: str,
        price: int,
        customer_email: str,
        customer_name: str = "",
        customer_phone: str = "",
        teacher_id: str = ""
    ) -> Dict[str, Any]:
        """
        Create hosted checkout payment for shared link purchase
        
        Args:
            link_code: Shared link code
            title: Resource title
            price: Price in TZS
            customer_email: Customer email
            customer_name: Customer name (optional)
            customer_phone: Customer phone (optional for hosted checkout, format: 255712345678)
            teacher_id: Teacher ID who owns the resource
        
        Returns:
            Dict containing checkout URL and payment details
        """
        merchant_reference = f"link_{link_code}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        
        return await self.create_hosted_checkout_payment(
            amount=str(price),
            order_reference=merchant_reference,
            currency="TZS",
            customer_email=customer_email,
            customer_phone=customer_phone,
            customer_name=customer_name,
            description=f"Purchase: {title}"
        )
    
    def map_status(self, clickpesa_status: str) -> str:
        """
        Map ClickPesa status to internal status
        
        Args:
            clickpesa_status: Status from ClickPesa
        
        Returns:
            Internal status string
        """
        return CLICKPESA_STATUS_MAP.get(clickpesa_status.lower(), "pending")
    
    async def verify_payment_webhook(self, payload: Dict[str, Any], signature: str = "") -> bool:
        """
        Verify ClickPesa webhook signature
        
        Args:
            payload: Webhook payload
            signature: Signature from header (if provided)
        
        Returns:
            True if valid, False otherwise
        """
        # TODO: Implement webhook verification based on ClickPesa documentation
        # This would typically verify HMAC signature
        if not signature:
            logger.warning("No signature provided for webhook verification")
            return False
        
        # Example verification (adjust based on actual ClickPesa implementation)
        expected_signature = self._generate_checksum(payload)
        return hmac.compare_digest(expected_signature, signature)


# Singleton instance
clickpesa_service = ClickPesaService()