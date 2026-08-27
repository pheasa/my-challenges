# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import TeamWorkSerializer
from plane.db.models import Project, ProjectTeamWork, TeamWork

from .base import BaseViewSet


class ProjectTeamWorkViewSet(BaseViewSet):
    serializer_class = TeamWorkSerializer
    model = ProjectTeamWork

    def get_queryset(self):
        return ProjectTeamWork.objects.filter(
            project_id=self.kwargs.get("project_id"),
            project__workspace__slug=self.kwargs.get("slug"),
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug, project_id):
        team_work_ids = self.get_queryset().values_list("team_work_id", flat=True)
        team_works = TeamWork.objects.filter(pk__in=team_work_ids, workspace__slug=slug)
        serializer = TeamWorkSerializer(team_works, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def set(self, request, slug, project_id):
        project = Project.objects.filter(pk=project_id, workspace__slug=slug).first()
        if not project:
            return Response(status=status.HTTP_404_NOT_FOUND)

        team_work_ids = request.data.get("team_work_ids", [])
        if not isinstance(team_work_ids, list):
            return Response(
                {"error": "team_work_ids must be a list"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Normalize to strings so set arithmetic below compares like-for-like
        # (values_list returns uuid.UUID objects, the payload has strings).
        new_ids = {str(team_work_id) for team_work_id in team_work_ids}

        # All team works must belong to this workspace
        valid_team_work_ids = {
            str(team_work_id)
            for team_work_id in TeamWork.objects.filter(pk__in=new_ids, workspace__slug=slug).values_list(
                "id", flat=True
            )
        }
        invalid_ids = new_ids - valid_team_work_ids
        if invalid_ids:
            return Response(
                {"error": "One or more team works do not exist in this workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_ids = {
            str(team_work_id)
            for team_work_id in self.get_queryset().values_list("team_work_id", flat=True)
        }

        # Remove team works that are no longer selected
        to_remove = current_ids - new_ids
        if to_remove:
            self.get_queryset().filter(team_work_id__in=to_remove).delete()

        # Add newly selected team works
        to_add = new_ids - current_ids
        if to_add:
            ProjectTeamWork.objects.bulk_create(
                [
                    ProjectTeamWork(
                        project_id=project_id,
                        workspace_id=project.workspace_id,
                        team_work_id=team_work_id,
                        created_by=request.user,
                    )
                    for team_work_id in to_add
                ],
                batch_size=100,
            )

        team_works = TeamWork.objects.filter(pk__in=new_ids, workspace__slug=slug)
        serializer = TeamWorkSerializer(team_works, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
