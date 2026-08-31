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
from plane.app.serializers import IssueDiagramSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import IssueDiagram, Diagram, Project
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.host import base_host


class IssueDiagramViewSet(BaseViewSet):
    permission_classes = [ProjectEntityPermission]
    model = IssueDiagram
    serializer_class = IssueDiagramSerializer

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
            .select_related("diagram")
            .order_by("-created_at")
            .distinct()
        )

    def create(self, request, slug, project_id, issue_id):
        diagram_ids = request.data.get("diagram_ids", [])
        diagram_id = request.data.get("diagram_id", None)
        if diagram_id:
            diagram_ids.append(diagram_id)

        if not diagram_ids:
            return Response({"error": "Please provide diagram_ids to link."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate diagrams belong to project/workspace
        diagrams = list(
            Diagram.objects.filter(
                workspace__slug=slug,
                projects__id=project_id,
                id__in=diagram_ids,
                archived_at__isnull=True,
            ).distinct()
        )

        project = Project.objects.get(pk=project_id)
        created_links = []
        for diagram in diagrams:
            issue_diagram, created = IssueDiagram.objects.get_or_create(
                issue_id=issue_id,
                diagram_id=diagram.id,
                defaults={
                    "project_id": project_id,
                    "workspace_id": project.workspace_id,
                    "created_by": request.user,
                    "updated_by": request.user,
                },
            )
            created_links.append(issue_diagram)
            if created:
                issue_activity.delay(
                    type="diagram.activity.created",
                    requested_data=json.dumps(
                        {"diagram_id": str(diagram.id), "name": diagram.name or "Untitled Diagram"},
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

        serializer = IssueDiagramSerializer(created_links, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, slug, project_id, issue_id, pk):
        issue_diagram = IssueDiagram.objects.filter(
            Q(diagram_id=pk) | Q(pk=pk),
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
        ).first()

        if not issue_diagram:
            return Response({"error": "Linked diagram not found."}, status=status.HTTP_404_NOT_FOUND)

        diagram_name = issue_diagram.diagram.name if issue_diagram.diagram else "Untitled Diagram"
        diagram_id = str(issue_diagram.diagram_id)

        issue_activity.delay(
            type="diagram.activity.deleted",
            requested_data=json.dumps({"diagram_id": diagram_id, "name": diagram_name}, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=json.dumps({"diagram_id": diagram_id, "name": diagram_name}, cls=DjangoJSONEncoder),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )

        issue_diagram.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
