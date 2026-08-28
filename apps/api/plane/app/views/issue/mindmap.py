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
from plane.app.serializers import IssueMindmapSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import IssueMindmap, Mindmap, Project
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.host import base_host


class IssueMindmapViewSet(BaseViewSet):
    permission_classes = [ProjectEntityPermission]
    model = IssueMindmap
    serializer_class = IssueMindmapSerializer

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
            .select_related("mindmap")
            .order_by("-created_at")
            .distinct()
        )

    def create(self, request, slug, project_id, issue_id):
        mindmap_ids = request.data.get("mindmap_ids", [])
        mindmap_id = request.data.get("mindmap_id", None)
        if mindmap_id:
            mindmap_ids.append(mindmap_id)

        if not mindmap_ids:
            return Response({"error": "Please provide mindmap_ids to link."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate mindmaps belong to project/workspace
        mindmaps = list(
            Mindmap.objects.filter(
                workspace__slug=slug,
                projects__id=project_id,
                id__in=mindmap_ids,
                archived_at__isnull=True,
            ).distinct()
        )

        project = Project.objects.get(pk=project_id)
        created_links = []
        for mindmap in mindmaps:
            issue_mindmap, created = IssueMindmap.objects.get_or_create(
                issue_id=issue_id,
                mindmap_id=mindmap.id,
                defaults={
                    "project_id": project_id,
                    "workspace_id": project.workspace_id,
                    "created_by": request.user,
                    "updated_by": request.user,
                },
            )
            created_links.append(issue_mindmap)
            if created:
                issue_activity.delay(
                    type="mindmap.activity.created",
                    requested_data=json.dumps(
                        {"mindmap_id": str(mindmap.id), "name": mindmap.name or "Untitled Mindmap"},
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

        serializer = IssueMindmapSerializer(created_links, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, slug, project_id, issue_id, pk):
        issue_mindmap = IssueMindmap.objects.filter(
            Q(mindmap_id=pk) | Q(pk=pk),
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
        ).first()

        if not issue_mindmap:
            return Response({"error": "Linked mindmap not found."}, status=status.HTTP_404_NOT_FOUND)

        mindmap_name = issue_mindmap.mindmap.name if issue_mindmap.mindmap else "Untitled Mindmap"
        mindmap_id = str(issue_mindmap.mindmap_id)

        issue_activity.delay(
            type="mindmap.activity.deleted",
            requested_data=json.dumps({"mindmap_id": mindmap_id, "name": mindmap_name}, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=json.dumps({"mindmap_id": mindmap_id, "name": mindmap_name}, cls=DjangoJSONEncoder),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )

        issue_mindmap.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
