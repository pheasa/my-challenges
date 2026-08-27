# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import TeamWorkSerializer
from plane.db.models import Workspace, TeamWork

from .. import BaseViewSet


class TeamWorkViewSet(BaseViewSet):
    serializer_class = TeamWorkSerializer
    model = TeamWork

    search_fields = ["name", "role"]

    def get_queryset(self):
        return self.filter_queryset(
            super().get_queryset().filter(workspace__slug=self.kwargs.get("slug"))
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug):
        team_works = self.get_queryset()
        serializer = TeamWorkSerializer(team_works, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        team_work = self.get_queryset().filter(pk=pk).first()
        if not team_work:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = TeamWorkSerializer(team_work)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = TeamWorkSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace=workspace, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        team_work = self.get_queryset().filter(pk=pk).first()
        if not team_work:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = TeamWorkSerializer(team_work, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        team_work = self.get_queryset().filter(pk=pk).first()
        if not team_work:
            return Response(status=status.HTTP_404_NOT_FOUND)
        team_work.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
