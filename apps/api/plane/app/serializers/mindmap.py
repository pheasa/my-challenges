# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import (
    Mindmap,
    ProjectMindmap,
    Project,
)


class MindmapSerializer(BaseSerializer):
    is_favorite = serializers.BooleanField(read_only=True)
    project_ids = serializers.ListField(child=serializers.UUIDField(), required=False)

    class Meta:
        model = Mindmap
        fields = [
            "id",
            "name",
            "data",
            "owned_by",
            "access",
            "color",
            "is_favorite",
            "is_locked",
            "archived_at",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "view_props",
            "logo_props",
            "project_ids",
        ]
        read_only_fields = ["workspace", "owned_by"]

    def create(self, validated_data):
        project_id = self.context.get("project_id")
        owned_by_id = self.context.get("owned_by_id")

        project = Project.objects.get(pk=project_id)

        mindmap = Mindmap.objects.create(
            **validated_data,
            owned_by_id=owned_by_id,
            workspace_id=project.workspace_id,
        )

        ProjectMindmap.objects.create(
            workspace_id=mindmap.workspace_id,
            project_id=project_id,
            mindmap_id=mindmap.id,
            created_by_id=mindmap.created_by_id,
            updated_by_id=mindmap.updated_by_id,
        )

        return mindmap


class MindmapDetailSerializer(MindmapSerializer):
    class Meta(MindmapSerializer.Meta):
        fields = MindmapSerializer.Meta.fields
