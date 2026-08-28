# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
from django.db.models import Q
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder
from rest_framework.response import Response
from rest_framework import status

from .. import BaseViewSet
from plane.app.serializers import IssuePageSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import IssuePage, Page, Project
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.host import base_host


class IssuePageViewSet(BaseViewSet):
    permission_classes = [ProjectEntityPermission]
    model = IssuePage
    serializer_class = IssuePageSerializer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related("page")
            .order_by("-created_at")
            .distinct()
        )

    def create(self, request, slug, project_id, issue_id):
        page_ids = request.data.get("page_ids", [])
        page_id = request.data.get("page_id", None)
        if page_id:
            page_ids.append(page_id)

        if not page_ids:
            return Response({"error": "Please provide page_ids to link."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate pages belong to project/workspace
        pages = list(
            Page.objects.filter(
                workspace__slug=slug,
                projects__id=project_id,
                id__in=page_ids,
                archived_at__isnull=True,
            ).distinct()
        )

        project = Project.objects.get(pk=project_id)
        created_links = []
        for page in pages:
            issue_page, created = IssuePage.objects.get_or_create(
                issue_id=issue_id,
                page_id=page.id,
                defaults={
                    "project_id": project_id,
                    "workspace_id": project.workspace_id,
                    "created_by": request.user,
                    "updated_by": request.user,
                },
            )
            created_links.append(issue_page)
            if created:
                issue_activity.delay(
                    type="page.activity.created",
                    requested_data=json.dumps(
                        {"page_id": str(page.id), "name": page.name or "Untitled Page"},
                        cls=DjangoJSONEncoder,
                    ),
                    actor_id=str(request.user.id),
                    issue_id=str(issue_id),
                    project_id=str(project_id),
                    current_instance=None,
                    epoch=int(timezone.now().timestamp()),
                    notification=True,
                    origin=base_host(request=request, is_app=True),
                )

        serializer = IssuePageSerializer(created_links, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, slug, project_id, issue_id, pk):
        issue_page = IssuePage.objects.filter(
            Q(page_id=pk) | Q(pk=pk),
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
        ).first()

        if not issue_page:
            return Response({"error": "Linked page not found."}, status=status.HTTP_404_NOT_FOUND)

        page_name = issue_page.page.name if issue_page.page else "Untitled Page"
        page_id = str(issue_page.page_id)

        issue_activity.delay(
            type="page.activity.deleted",
            requested_data=json.dumps({"page_id": page_id, "name": page_name}, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=json.dumps({"page_id": page_id, "name": page_name}, cls=DjangoJSONEncoder),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )

        issue_page.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
