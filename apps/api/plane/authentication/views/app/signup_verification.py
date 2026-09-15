# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json
import os
import secrets
import uuid

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import validate_email

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from zxcvbn import zxcvbn

# Module imports
from plane.authentication.rate_limit import AuthenticationThrottle
from plane.authentication.utils.host import base_host
from plane.authentication.utils.login import user_login
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.bgtasks.signup_verification_task import send_signup_verification_email
from plane.db.models import Profile, User, WorkspaceMemberInvite
from plane.license.models import Instance
from plane.license.utils.instance_value import get_configuration_value
from plane.settings.redis import redis_instance


class SendSignUpLinkEndpoint(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthenticationThrottle]

    def post(self, request):
        # Check instance setup
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return Response(
                {"error": "INSTANCE_NOT_CONFIGURED", "message": "Instance is not yet configured."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response(
                {"error": "EMAIL_REQUIRED", "message": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {"error": "INVALID_EMAIL", "message": "Please provide a valid email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {
                    "error": "USER_ALREADY_EXIST",
                    "message": "An account with this email already exists. Please sign in instead.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if signup is allowed
        (ENABLE_SIGNUP,) = get_configuration_value([
            {"key": "ENABLE_SIGNUP", "default": os.environ.get("ENABLE_SIGNUP", "1")}
        ])
        if ENABLE_SIGNUP == "0" and not WorkspaceMemberInvite.objects.filter(email=email).exists():
            return Response(
                {"error": "SIGNUP_DISABLED", "message": "Sign up is currently disabled on this instance."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Support contact configuration
        (SUPPORT_TELEGRAM_URL, SUPPORT_FACEBOOK_URL, SUPPORT_EMAIL) = get_configuration_value([
            {
                "key": "SUPPORT_TELEGRAM_URL",
                "default": os.environ.get("SUPPORT_TELEGRAM_URL", "https://t.me/plane_support"),
            },
            {
                "key": "SUPPORT_FACEBOOK_URL",
                "default": os.environ.get("SUPPORT_FACEBOOK_URL", "https://facebook.com/plane"),
            },
            {
                "key": "SUPPORT_EMAIL",
                "default": os.environ.get("SUPPORT_EMAIL", "support@plane.so"),
            },
        ])

        support_channels = {
            "telegram": SUPPORT_TELEGRAM_URL,
            "facebook": SUPPORT_FACEBOOK_URL,
            "email": SUPPORT_EMAIL,
        }

        ri = redis_instance()
        email_key = f"signup_email:{email}"

        # Check if an unexpired verification link was already issued within 24h
        if ri.exists(email_key):
            ttl = ri.ttl(email_key)
            if ttl > 0:
                return Response(
                    {
                        "status": "ACTIVE_LINK_EXISTS",
                        "message": (
                            "A sign-up verification link has already been sent to this email address and is valid for 24 hours. "
                            "Please check your inbox and spam/junk folders. If you have not received it, please contact our support team."
                        ),
                        "expires_in": ttl,
                        "support_channels": support_channels,
                    },
                    status=status.HTTP_200_OK,
                )

        # Generate a 24-hour cryptographically secure single-use token
        token = secrets.token_urlsafe(32)
        token_key = f"signup_token:{token}"
        expiry = 86400  # 24 hours in seconds

        ri.set(token_key, json.dumps({"email": email}), ex=expiry)
        ri.set(email_key, json.dumps({"token": token}), ex=expiry)

        current_site = base_host(request=request, is_app=True)
        send_signup_verification_email.delay(email, token, current_site)

        return Response(
            {
                "status": "LINK_SENT",
                "message": (
                    f"We have sent a verification link to {email}. "
                    "Please check your email and open the link to start using the app. This link will expire in 24 hours."
                ),
                "expires_in": expiry,
                "support_channels": support_channels,
            },
            status=status.HTTP_200_OK,
        )


class VerifySignUpTokenEndpoint(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get("token", "").strip()
        email = request.query_params.get("email", "").strip().lower()

        if not token or not email:
            return Response(
                {"error": "INVALID_PARAMETERS", "message": "Token and email are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ri = redis_instance()
        token_key = f"signup_token:{token}"

        if not ri.exists(token_key):
            return Response(
                {
                    "error": "TOKEN_EXPIRED_OR_INVALID",
                    "message": "This sign-up link has expired (links are valid for 24 hours) or has already been used.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            data = json.loads(ri.get(token_key))
            if data.get("email") != email:
                return Response(
                    {"error": "TOKEN_MISMATCH", "message": "Verification token does not match the provided email address."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception:
            return Response(
                {"error": "TOKEN_INVALID", "message": "Invalid verification token data."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"valid": True, "email": email}, status=status.HTTP_200_OK)


class CompleteSignUpEndpoint(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthenticationThrottle]

    def post(self, request):
        token = request.data.get("token", "").strip()
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")
        first_name = request.data.get("first_name", "").strip()
        last_name = request.data.get("last_name", "").strip()

        if not token or not email or not password:
            return Response(
                {"error": "MISSING_REQUIRED_FIELDS", "message": "Token, email, and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ri = redis_instance()
        token_key = f"signup_token:{token}"
        email_key = f"signup_email:{email}"

        if not ri.exists(token_key):
            return Response(
                {
                    "error": "TOKEN_EXPIRED_OR_INVALID",
                    "message": "This sign-up link has expired (links are valid for 24 hours) or has already been used.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            data = json.loads(ri.get(token_key))
            if data.get("email") != email:
                return Response(
                    {"error": "TOKEN_MISMATCH", "message": "Verification token does not match the provided email address."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception:
            return Response(
                {"error": "TOKEN_INVALID", "message": "Invalid token data."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate password strength
        password_eval = zxcvbn(password)
        if password_eval.get("score", 0) < 3:
            return Response(
                {
                    "error": "PASSWORD_TOO_WEAK",
                    "message": "Password is too weak. Please choose a stronger password.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ensure user does not already exist
        if User.objects.filter(email=email).exists():
            # Invalidate the token
            ri.delete(token_key)
            ri.delete(email_key)
            return Response(
                {"error": "USER_ALREADY_EXIST", "message": "An account with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create real User and Profile in DB only NOW upon verification!
        user = User(
            email=email,
            username=uuid.uuid4().hex,
            first_name=first_name,
            last_name=last_name,
        )
        user.set_password(password)
        user.is_password_autoset = False
        user.is_email_verified = True
        user.is_active = True
        user.save()

        Profile.objects.create(user=user)

        # INVOKE TO DEAD: Immediately remove tokens from Redis so the link can never be used again
        ri.delete(token_key)
        ri.delete(email_key)

        # Process any pending workspace or project invitations
        post_user_auth_workflow(user=user, is_signup=True, request=request)

        # Authenticate and start session
        user_login(request=request, user=user, is_app=True)

        return Response(
            {
                "success": True,
                "message": "Account created and verified successfully.",
                "redirect_url": "/onboarding",
            },
            status=status.HTTP_201_CREATED,
        )
