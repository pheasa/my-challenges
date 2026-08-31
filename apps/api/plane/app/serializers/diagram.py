# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import (
    Diagram,
    ProjectDiagram,
    Project,
)


class DiagramSerializer(BaseSerializer):
    is_favorite = serializers.BooleanField(read_only=True)
    project_ids = serializers.ListField(child=serializers.UUIDField(), required=False)

    class Meta:
        model = Diagram
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

        diagram = Diagram.objects.create(
            **validated_data,
            owned_by_id=owned_by_id,
            workspace_id=project.workspace_id,
        )

        ProjectDiagram.objects.create(
            workspace_id=diagram.workspace_id,
            project_id=project_id,
            diagram_id=diagram.id,
            created_by_id=diagram.created_by_id,
            updated_by_id=diagram.updated_by_id,
        )

        return diagram


class DiagramDetailSerializer(DiagramSerializer):
    class Meta(DiagramSerializer.Meta):
        fields = DiagramSerializer.Meta.fields
