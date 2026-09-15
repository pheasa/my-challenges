# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
import uuid
import pytest
from unittest.mock import patch
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import User, Profile
from plane.license.models import Instance
from plane.settings.redis import redis_instance


@pytest.fixture
def setup_instance(db):
    instance_id = uuid.uuid4() if not Instance.objects.exists() else Instance.objects.first().id
    instance, _ = Instance.objects.update_or_create(
        id=instance_id,
        defaults={
            "instance_name": "Test Instance",
            "instance_id": str(uuid.uuid4()),
            "current_version": "1.0.0",
            "domain": "http://localhost:8000",
            "last_checked_at": timezone.now(),
            "is_setup_done": True,
        },
    )
    return instance


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.contract
class TestSignUpVerificationWorkflow:
    def setup_method(self):
        self.ri = redis_instance()

    def teardown_method(self):
        # Clean up any test keys from redis
        test_email = "newuser@example.com"
        email_key = f"signup_email:{test_email}"
        if self.ri.exists(email_key):
            try:
                data = json.loads(self.ri.get(email_key))
                token = data.get("token")
                if token:
                    self.ri.delete(f"signup_token:{token}")
            except Exception:
                pass
            self.ri.delete(email_key)

    @patch("plane.authentication.views.app.signup_verification.send_signup_verification_email.delay")
    def test_send_signup_link_success_and_no_db_user(self, mock_email_task, api_client, setup_instance, db):
        email = "newuser@example.com"
        url = reverse("sign-up-send-link")

        response = api_client.post(url, {"email": email}, format="json")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "LINK_SENT"
        assert data["expires_in"] == 86400

        # CRITICAL REQUIREMENT: Real email verification required, NO user record in DB yet!
        assert not User.objects.filter(email=email).exists()

        # Check redis storage
        email_key = f"signup_email:{email}"
        assert self.ri.exists(email_key)
        saved_email_data = json.loads(self.ri.get(email_key))
        token = saved_email_data["token"]
        token_key = f"signup_token:{token}"
        assert self.ri.exists(token_key)

        # Check background task was dispatched
        mock_email_task.assert_called_once()

    @patch("plane.authentication.views.app.signup_verification.send_signup_verification_email.delay")
    def test_send_signup_link_active_link_exists_suppressed(self, mock_email_task, api_client, setup_instance, db):
        email = "newuser@example.com"
        url = reverse("sign-up-send-link")

        # First call sends email
        res1 = api_client.post(url, {"email": email}, format="json")
        assert res1.status_code == status.HTTP_200_OK
        assert res1.json()["status"] == "LINK_SENT"
        assert mock_email_task.call_count == 1

        # Second call while link is still active (< 24h)
        res2 = api_client.post(url, {"email": email}, format="json")
        assert res2.status_code == status.HTTP_200_OK
        data2 = res2.json()

        # Must not send new email again!
        assert mock_email_task.call_count == 1
        assert data2["status"] == "ACTIVE_LINK_EXISTS"
        assert "support_channels" in data2
        assert "telegram" in data2["support_channels"]
        assert "facebook" in data2["support_channels"]
        assert "email" in data2["support_channels"]

    def test_verify_signup_token(self, api_client, setup_instance, db):
        email = "newuser@example.com"
        token = "test-token-123456"
        token_key = f"signup_token:{token}"
        self.ri.set(token_key, json.dumps({"email": email}), ex=3600)

        url = reverse("sign-up-verify-token")

        # Invalid token
        res_invalid = api_client.get(f"{url}?token=nonexistent&email={email}")
        assert res_invalid.status_code == status.HTTP_400_BAD_REQUEST

        # Valid token
        res_valid = api_client.get(f"{url}?token={token}&email={email}")
        assert res_valid.status_code == status.HTTP_200_OK
        assert res_valid.json()["valid"] is True

    def test_complete_signup_and_invoke_to_dead(self, api_client, setup_instance, db):
        email = "newuser@example.com"
        token = "test-token-789012"
        token_key = f"signup_token:{token}"
        email_key = f"signup_email:{email}"

        self.ri.set(token_key, json.dumps({"email": email}), ex=86400)
        self.ri.set(email_key, json.dumps({"token": token}), ex=86400)

        url = reverse("sign-up-complete")

        payload = {
            "token": token,
            "email": email,
            "password": "StrongPassword!2026#Plane",
            "first_name": "Verified",
            "last_name": "User",
        }

        # First completion: Success
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED

        # Check user and profile now created in DB!
        user = User.objects.filter(email=email).first()
        assert user is not None
        assert user.first_name == "Verified"
        assert user.last_name == "User"
        assert user.is_active is True
        assert user.is_email_verified is True
        assert user.check_password("StrongPassword!2026#Plane")

        profile = Profile.objects.filter(user=user).first()
        assert profile is not None
        assert profile.is_onboarded is False

        # CRITICAL REQUIREMENT: Link invoked to dead (tokens removed from Redis)
        assert not self.ri.exists(token_key)
        assert not self.ri.exists(email_key)

        # Second completion attempt must FAIL because link is dead!
        res_replay = api_client.post(url, payload, format="json")
        assert res_replay.status_code == status.HTTP_400_BAD_REQUEST
        assert res_replay.json()["error"] == "TOKEN_EXPIRED_OR_INVALID"
