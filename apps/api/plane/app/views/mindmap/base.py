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
    Count,
    Case,
    When,
    IntegerField,
)
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import (
    MindmapSerializer,
    MindmapDetailSerializer,
)
from plane.db.models import (
    Mindmap,
    UserFavorite,
    ProjectMember,
    ProjectMindmap,
    Project,
)
from ..base import BaseViewSet
from plane.app.permissions import ProjectMindmapPermission


class MindmapViewSet(BaseViewSet):
    serializer_class = MindmapSerializer
    model = Mindmap
    permission_classes = [ProjectMindmapPermission]
    search_fields = ["name"]

    def get_queryset(self):
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_type="mindmap",
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
                    ProjectMindmap.objects.filter(
                        mindmap_id=OuterRef("id"), project_id=self.kwargs.get("project_id")
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
        serializer = MindmapSerializer(
            data=request.data,
            context={
                "project_id": project_id,
                "owned_by_id": request.user.id,
            },
        )

        if serializer.is_valid():
            serializer.save()
            mindmap = self.get_queryset().get(pk=serializer.data["id"])
            detail_serializer = MindmapDetailSerializer(mindmap)
            return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, slug, project_id, mindmap_id):
        mindmap = self.get_queryset().get(pk=mindmap_id)
        serializer = MindmapDetailSerializer(mindmap)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, slug, project_id, mindmap_id):
        mindmap = Mindmap.objects.get(
            pk=mindmap_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_mindmaps__deleted_at__isnull=True,
        )

        if mindmap.is_locked:
            return Response(
                {"error": "Mindmap is locked"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if mindmap.archived_at:
            return Response(
                {"error": "Mindmap is archived"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MindmapSerializer(mindmap, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, slug, project_id, mindmap_id):
        mindmap = Mindmap.objects.get(
            pk=mindmap_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_mindmaps__deleted_at__isnull=True,
        )

        if mindmap.owned_by_id != request.user.id and (
            not ProjectMember.objects.filter(
                workspace__slug=slug,
                member=request.user,
                role=ROLE.ADMIN.value,
                project_id=project_id,
                is_active=True,
            ).exists()
        ):
            return Response(
                {"error": "Only admin or owner can delete the mindmap"},
                status=status.HTTP_403_FORBIDDEN,
            )

        mindmap.delete()
        UserFavorite.objects.filter(
            project=project_id,
            workspace__slug=slug,
            entity_identifier=mindmap_id,
            entity_type="mindmap",
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def archive(self, request, slug, project_id, mindmap_id):
        mindmap = Mindmap.objects.get(
            pk=mindmap_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_mindmaps__deleted_at__isnull=True,
        )

        mindmap.archived_at = datetime.now().date()
        mindmap.save()
        return Response({"archived_at": str(mindmap.archived_at)}, status=status.HTTP_200_OK)

    def unarchive(self, request, slug, project_id, mindmap_id):
        mindmap = Mindmap.objects.get(
            pk=mindmap_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_mindmaps__deleted_at__isnull=True,
        )

        mindmap.archived_at = None
        mindmap.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def lock(self, request, slug, project_id, mindmap_id):
        mindmap = Mindmap.objects.get(
            pk=mindmap_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_mindmaps__deleted_at__isnull=True,
        )
        mindmap.is_locked = True
        mindmap.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def unlock(self, request, slug, project_id, mindmap_id):
        mindmap = Mindmap.objects.get(
            pk=mindmap_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_mindmaps__deleted_at__isnull=True,
        )
        mindmap.is_locked = False
        mindmap.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def access(self, request, slug, project_id, mindmap_id):
        access = request.data.get("access", 0)
        mindmap = Mindmap.objects.get(
            pk=mindmap_id,
            workspace__slug=slug,
            projects__id=project_id,
            project_mindmaps__deleted_at__isnull=True,
        )

        if mindmap.access != access and mindmap.owned_by_id != request.user.id:
            return Response(
                {"error": "Access cannot be updated since this mindmap is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        mindmap.access = access
        mindmap.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MindmapFavoriteViewSet(BaseViewSet):
    model = UserFavorite

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id, mindmap_id):
        _ = UserFavorite.objects.create(
            project_id=project_id,
            entity_identifier=mindmap_id,
            entity_type="mindmap",
            user=request.user,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, mindmap_id):
        mindmap_favorite = UserFavorite.objects.get(
            project=project_id,
            user=request.user,
            workspace__slug=slug,
            entity_identifier=mindmap_id,
            entity_type="mindmap",
        )
        mindmap_favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)
