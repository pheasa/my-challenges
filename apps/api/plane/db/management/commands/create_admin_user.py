# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.core.management.base import BaseCommand

# Module imports
from plane.db.models import User
from plane.license.models import Instance, InstanceAdmin
from plane.utils.cache import invalidate_cache_directly


class Command(BaseCommand):
    help = "Create the first admin user (username: admin / password: admin@123) and promote them to instance admin"

    def handle(self, *args, **options):
        username = "admin"
        email = "admin@localhost"
        password = "admin@123"

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_superuser": True,
                "is_staff": True,
                "is_active": True,
                "is_email_verified": True,
            },
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created admin user '{username}' ({email})"))
        else:
            # Keep credentials in sync with the requested ones on re-runs
            user.email = email
            user.is_superuser = True
            user.is_staff = True
            user.is_active = True
            user.is_email_verified = True
            self.stdout.write(self.style.WARNING(f"Admin user '{username}' already exists, updating flags"))

        user.set_password(password)
        user.save()

        # Promote to instance admin (god mode) if an instance exists
        instance = Instance.objects.first()
        if instance is not None:
            _, admin_created = InstanceAdmin.objects.get_or_create(user=user, instance=instance, role=20)
            if admin_created:
                self.stdout.write(self.style.SUCCESS("User promoted to instance admin"))
            # Mark the instance as fully set up. The god-mode setup wizard
            # normally flips this flag; when bootstrapping via this command the
            # app would otherwise stay stuck on the "Welcome to Plane — Set up
            # your instance" / admin setup screens instead of the login page.
            if not instance.is_setup_done:
                instance.is_setup_done = True
                instance.save()
                # Drop any cached /api/instances/ response (which the web/admin
                # apps use to decide between the setup and login screens) so the
                # flipped flag is picked up immediately.
                invalidate_cache_directly(path="/api/instances/", user=False)
                self.stdout.write(self.style.SUCCESS("Instance marked as set up"))
        else:
            self.stdout.write(self.style.WARNING("No instance found yet — skipping instance-admin promotion"))

        self.stdout.write(self.style.SUCCESS("Done."))
