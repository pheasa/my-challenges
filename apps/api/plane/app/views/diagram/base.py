# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import datetime

from django.db.models import (
    Exists,
    OuterRef,
    Q,
    Value,
    UUIDField,
)
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import (
    DiagramSerializer,
    DiagramDetailSerializer,
)
from plane.db.models import (
    Diagram,
    UserFavorite,
    ProjectMember,
    ProjectDiagram,
    Project,
)
from ..base import BaseViewSet
from plane.app.permissions import ProjectDiagramPermission


class DiagramViewSet(BaseViewSet):
    serializer_class = DiagramSerializer
    model = Diagram
    permission_classes = [ProjectDiagramPermission]
    search_fields = ["name"]

    def get_queryset(self):
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="diagram",
            entity_identifier=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                projects__project_projectmember__member=self.request.user,
                projects__project_projectmember__is_active=True,
                projects__archived_at__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .prefetch_related("projects")
            .select_related("workspace")
            .select_related("owned_by")
            .annotate(is_favorite=Exists(subquery))
            .order_by("-is_favorite", "-created_at")
            .annotate(
                project=Exists(
                    ProjectDiagram.objects.filter(
                        diagram_id=OuterRef("id"), project_id=self.kwargs.get("project_id")
                    )
                )
            )
            .annotate(
                project_ids=Coalesce(
                    ArrayAgg("projects__id", distinct=True, filter=~Q(projects__id=True)),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .filter(project=True)
            .distinct()
        )

    def create(self, request, slug, project_id):
        serializer = DiagramSerializer(
            data=request.data,
            context={
                "project_id": project_id,
                "owned_by_id": request.user.id,
            },
        )

        if serializer.is_valid():
            serializer.save()
            diagram = self.get_queryset().get(pk=serializer.data["id"])
            detail_serializer = DiagramDetailSerializer(diagram)
            return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, slug, project_id, diagram_id):
        diagram = self.get_queryset().get(pk=diagram_id)
        serializer = DiagramDetailSerializer(diagram)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, slug, project_id, diagram_id):
        diagram = Diagram.objects.get(
            pk=diagram_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_diagrams__deleted_at__isnull=True,
        )

        if diagram.is_locked:
            return Response(
                {"error": "Diagram is locked"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if diagram.archived_at:
            return Response(
                {"error": "Diagram is archived"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = DiagramSerializer(diagram, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, slug, project_id, diagram_id):
        diagram = Diagram.objects.get(
            pk=diagram_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_diagrams__deleted_at__isnull=True,
        )

        if diagram.owned_by_id != request.user.id and (
            not ProjectMember.objects.filter(
                workspace__slug=slug,
                member=request.user,
                role=ROLE.ADMIN.value,
                project_id=project_id,
                is_active=True,
            ).exists()
        ):
            return Response(
                {"error": "Only admin or owner can delete the diagram"},
                status=status.HTTP_403_FORBIDDEN,
            )

        diagram.delete()
        UserFavorite.objects.filter(
            project=project_id,
            workspace__slug=slug,
            entity_identifier=diagram_id,
            entity_type="diagram",
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def archive(self, request, slug, project_id, diagram_id):
        diagram = Diagram.objects.get(
            pk=diagram_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_diagrams__deleted_at__isnull=True,
        )

        diagram.archived_at = datetime.now().date()
        diagram.save()
        return Response({"archived_at": str(diagram.archived_at)}, status=status.HTTP_200_OK)

    def unarchive(self, request, slug, project_id, diagram_id):
        diagram = Diagram.objects.get(
            pk=diagram_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_diagrams__deleted_at__isnull=True,
        )

        diagram.archived_at = None
        diagram.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def lock(self, request, slug, project_id, diagram_id):
        diagram = Diagram.objects.get(
            pk=diagram_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_diagrams__deleted_at__isnull=True,
        )
        diagram.is_locked = True
        diagram.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def unlock(self, request, slug, project_id, diagram_id):
        diagram = Diagram.objects.get(
            pk=diagram_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_diagrams__deleted_at__isnull=True,
        )
        diagram.is_locked = False
        diagram.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def access(self, request, slug, project_id, diagram_id):
        access = request.data.get("access", 0)
        diagram = Diagram.objects.get(
            pk=diagram_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_diagrams__deleted_at__isnull=True,
        )

        if diagram.access != access and diagram.owned_by_id != request.user.id:
            return Response(
                {"error": "Access cannot be updated since this diagram is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        diagram.access = access
        diagram.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DiagramFavoriteViewSet(BaseViewSet):
    model = UserFavorite

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id, diagram_id):
        _ = UserFavorite.objects.create(
            project_id=project_id,
            entity_identifier=diagram_id,
            entity_type="diagram",
            user=request.user,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, diagram_id):
        diagram_favorite = UserFavorite.objects.get(
            project=project_id,
            user=request.user,
            workspace__slug=slug,
            entity_identifier=diagram_id,
            entity_type="diagram",
        )
        diagram_favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)
