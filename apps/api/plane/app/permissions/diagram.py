# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework.permissions import BasePermission, SAFE_METHODS

from plane.db.models import ProjectMember, Diagram
from plane.app.permissions import ROLE

ADMIN = ROLE.ADMIN.value
MEMBER = ROLE.MEMBER.value
GUEST = ROLE.GUEST.value


class ProjectDiagramPermission(BasePermission):
    """
    Permission to control access to diagrams within a project based on user roles and access level.
    """

    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        user_id = request.user.id
        slug = view.kwargs.get("slug")
        diagram_id = view.kwargs.get("diagram_id")
        project_id = view.kwargs.get("project_id")

        role = (
            ProjectMember.objects.filter(
                member=request.user,
                workspace__slug=slug,
                is_active=True,
                project_id=project_id,
            )
            .values_list("role", flat=True)
            .first()
        )
        if not role:
            return False

        if diagram_id:
            diagram = Diagram.objects.filter(
                id=diagram_id,
                workspace__slug=slug,
                project_diagrams__project_id=project_id,
                project_diagrams__deleted_at__isnull=True,
            ).first()
            if diagram is None:
                return False

            if diagram.owned_by_id == user_id:
                return True

            if diagram.access == Diagram.PRIVATE_ACCESS:
                return False

        method = request.method
        if method in SAFE_METHODS:
            return role in [ADMIN, MEMBER, GUEST]
        if method == "POST":
            return role in [ADMIN, MEMBER]
        if method in ["PUT", "PATCH"]:
            return role in [ADMIN, MEMBER]
        if method == "DELETE":
            return role in [ADMIN]

        return False
