"""
Brevo Email Service for UNIFY Platform
Handles all transactional email sending via Brevo API
"""
import httpx
import logging
import os
from typing import Dict, Optional, List
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


class BrevoEmailService:
    """Service for sending transactional emails via Brevo"""
    
    def __init__(self):
        # Load config lazily to ensure .env is loaded first
        self._api_key = None
        self._email_from = None
        self._email_from_name = None
    
    @property
    def api_key(self):
        if self._api_key is None:
            self._api_key = os.environ.get('BREVO_API_KEY', '')
        return self._api_key
    
    @property
    def email_from(self):
        if self._email_from is None:
            self._email_from = os.environ.get('EMAIL_FROM', 'noreply@unify.com')
        return self._email_from
    
    @property
    def email_from_name(self):
        if self._email_from_name is None:
            self._email_from_name = os.environ.get('EMAIL_FROM_NAME', 'UNIFY Platform')
        return self._email_from_name
    
    @property
    def headers(self):
        return {
            "accept": "application/json",
            "api-key": self.api_key,
            "content-type": "application/json"
        }
    
    async def send_email(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> Dict:
        """
        Send a transactional email via Brevo API
        
        Returns:
            Dict with success status and message_id or error
        """
        if not self.api_key:
            logger.warning("Brevo API key not configured, skipping email send")
            return {"success": False, "error": "Email service not configured"}
        
        payload = {
            "sender": {
                "name": self.email_from_name,
                "email": self.email_from
            },
            "to": [
                {
                    "email": to_email,
                    "name": to_name
                }
            ],
            "subject": subject,
            "htmlContent": html_content
        }
        
        if text_content:
            payload["textContent"] = text_content
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    BREVO_API_URL,
                    json=payload,
                    headers=self.headers
                )
                
                response_data = response.json()
                
                if response.status_code == 201:
                    logger.info(f"Email sent successfully to {to_email}, messageId: {response_data.get('messageId')}")
                    return {
                        "success": True,
                        "message_id": response_data.get("messageId")
                    }
                else:
                    logger.error(f"Failed to send email to {to_email}: {response.text}")
                    return {
                        "success": False,
                        "error": response_data.get("message", "Unknown error"),
                        "code": response_data.get("code")
                    }
                    
        except Exception as e:
            logger.error(f"Exception sending email to {to_email}: {str(e)}")
            return {"success": False, "error": str(e)}
    
    # ============== EMAIL TEMPLATES ==============
    
    async def send_welcome_email(self, to_email: str, to_name: str, university_name: str = "UNIFY") -> Dict:
        """Send welcome email to new student registration"""
        subject = f"Welcome to {university_name} - Registration Successful!"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to {university_name}!</h1>
                </div>
                <div class="content">
                    <p>Dear {to_name},</p>
                    <p>Thank you for registering with {university_name}. Your account has been successfully created!</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Complete your application form</li>
                        <li>Upload required documents</li>
                        <li>Take entrance tests (if required)</li>
                        <li>Make fee payments</li>
                        <li>Track your application status</li>
                    </ul>
                    <p>If you have any questions, please don't hesitate to contact our admissions team.</p>
                    <p>Best regards,<br>The {university_name} Admissions Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from UNIFY Admissions Platform</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self.send_email(to_email, to_name, subject, html_content)
    
    async def send_lead_assignment_email(
        self, 
        to_email: str, 
        to_name: str, 
        lead_name: str,
        lead_email: str,
        lead_phone: str
    ) -> Dict:
        """Send notification to counsellor when a lead is assigned"""
        subject = f"New Lead Assigned: {lead_name}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .lead-card {{ background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0; }}
                .label {{ font-weight: bold; color: #666; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>New Lead Assignment</h2>
                </div>
                <div class="content">
                    <p>Hi {to_name},</p>
                    <p>A new lead has been assigned to you. Please follow up promptly.</p>
                    
                    <div class="lead-card">
                        <p><span class="label">Name:</span> {lead_name}</p>
                        <p><span class="label">Email:</span> {lead_email}</p>
                        <p><span class="label">Phone:</span> {lead_phone}</p>
                    </div>
                    
                    <p>Please log in to the UNIFY platform to view complete details and take action.</p>
                    <p>Best regards,<br>UNIFY Platform</p>
                </div>
                <div class="footer">
                    <p>This is an automated notification from UNIFY</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self.send_email(to_email, to_name, subject, html_content)
    
    async def send_password_reset_email(self, to_email: str, to_name: str, reset_token: str) -> Dict:
        """Send password reset email with token"""
        subject = "Password Reset Request - UNIFY"
        # In production, this would link to actual reset page
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .token-box {{ background: #fee2e2; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-family: monospace; margin: 20px 0; }}
                .warning {{ color: #dc2626; font-size: 14px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Password Reset Request</h2>
                </div>
                <div class="content">
                    <p>Hi {to_name},</p>
                    <p>We received a request to reset your password. Use the code below to reset it:</p>
                    
                    <div class="token-box">
                        {reset_token}
                    </div>
                    
                    <p class="warning">This code expires in 1 hour. If you didn't request this, please ignore this email.</p>
                    <p>Best regards,<br>UNIFY Security Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated security message from UNIFY</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self.send_email(to_email, to_name, subject, html_content)
    
    async def send_payment_receipt_email(
        self,
        to_email: str,
        to_name: str,
        amount: float,
        payment_id: str,
        fee_type: str,
        university_name: str
    ) -> Dict:
        """Send payment receipt after successful payment"""
        subject = f"Payment Receipt - {university_name}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .receipt {{ background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0; }}
                .amount {{ font-size: 32px; color: #059669; font-weight: bold; text-align: center; }}
                .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>✓ Payment Successful</h2>
                </div>
                <div class="content">
                    <p>Dear {to_name},</p>
                    <p>Your payment has been successfully processed. Here are the details:</p>
                    
                    <div class="receipt">
                        <div class="amount">₹{amount:,.2f}</div>
                        <hr style="margin: 20px 0;">
                        <div class="detail-row">
                            <span>Payment ID:</span>
                            <span>{payment_id}</span>
                        </div>
                        <div class="detail-row">
                            <span>Fee Type:</span>
                            <span>{fee_type}</span>
                        </div>
                        <div class="detail-row">
                            <span>University:</span>
                            <span>{university_name}</span>
                        </div>
                        <div class="detail-row">
                            <span>Date:</span>
                            <span>{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</span>
                        </div>
                    </div>
                    
                    <p>Please save this email for your records.</p>
                    <p>Best regards,<br>{university_name} Admissions</p>
                </div>
                <div class="footer">
                    <p>This is an automated receipt from UNIFY Platform</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self.send_email(to_email, to_name, subject, html_content)
    
    async def send_application_status_email(
        self,
        to_email: str,
        to_name: str,
        application_number: str,
        status: str,
        message: Optional[str] = None
    ) -> Dict:
        """Send application status update email"""
        status_colors = {
            "approved": "#059669",
            "rejected": "#dc2626",
            "pending": "#f59e0b",
            "submitted": "#2563eb"
        }
        status_messages = {
            "approved": "Congratulations! Your application has been approved.",
            "rejected": "We regret to inform you that your application was not successful.",
            "pending": "Your application is currently under review.",
            "submitted": "Your application has been successfully submitted."
        }
        
        color = status_colors.get(status.lower(), "#666")
        default_message = status_messages.get(status.lower(), f"Your application status is: {status}")
        
        subject = f"Application Status Update - {application_number}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: {color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .status-badge {{ display: inline-block; background: {color}; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; text-transform: uppercase; }}
                .app-number {{ background: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Application Status Update</h2>
                </div>
                <div class="content">
                    <p>Dear {to_name},</p>
                    
                    <div class="app-number">
                        <p style="margin: 0; color: #666;">Application Number</p>
                        <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">{application_number}</p>
                    </div>
                    
                    <p style="text-align: center;">
                        <span class="status-badge">{status}</span>
                    </p>
                    
                    <p>{message or default_message}</p>
                    
                    <p>Log in to your account to view complete details.</p>
                    <p>Best regards,<br>UNIFY Admissions Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated notification from UNIFY Platform</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self.send_email(to_email, to_name, subject, html_content)
    
    async def send_staff_credentials_email(
        self,
        to_email: str,
        to_name: str,
        person_id: str,
        password: str,
        role: str,
        university_name: str
    ) -> Dict:
        """Send credentials to new staff member"""
        subject = f"Your UNIFY Account Credentials - {university_name}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .credentials {{ background: white; padding: 20px; border-radius: 8px; border: 2px dashed #7c3aed; margin: 20px 0; }}
                .cred-item {{ padding: 10px 0; }}
                .label {{ font-weight: bold; color: #666; }}
                .value {{ font-family: monospace; background: #f3f4f6; padding: 5px 10px; border-radius: 4px; }}
                .warning {{ background: #fef3c7; padding: 15px; border-radius: 8px; color: #92400e; margin-top: 20px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Welcome to UNIFY</h2>
                </div>
                <div class="content">
                    <p>Hi {to_name},</p>
                    <p>Your account has been created for {university_name}. Here are your login credentials:</p>
                    
                    <div class="credentials">
                        <div class="cred-item">
                            <span class="label">Role:</span> <span class="value">{role.replace('_', ' ').title()}</span>
                        </div>
                        <div class="cred-item">
                            <span class="label">Person ID:</span> <span class="value">{person_id}</span>
                        </div>
                        <div class="cred-item">
                            <span class="label">Password:</span> <span class="value">{password}</span>
                        </div>
                    </div>
                    
                    <div class="warning">
                        ⚠️ Please change your password after your first login for security.
                    </div>
                    
                    <p>Best regards,<br>{university_name} Admin Team</p>
                </div>
                <div class="footer">
                    <p>This is a confidential message from UNIFY Platform</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self.send_email(to_email, to_name, subject, html_content)


# Singleton instance
email_service = BrevoEmailService()
