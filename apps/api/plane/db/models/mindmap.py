# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models

from .base import BaseModel


def get_default_mindmap_data():
    return {
        "tree": {
            "text": "MIND MAPPING",
            "x": 500,
            "y": 300,
            "isRoot": True,
            "children": [
                {
                    "text": "Ideas",
                    "x": 260,
                    "y": 160,
                    "children": [
                        {"text": "Plan", "x": 80, "y": 80},
                        {"text": "Research", "x": 80, "y": 160},
                    ],
                },
                {
                    "text": "Execution",
                    "x": 740,
                    "y": 160,
                    "children": [
                        {"text": "Design", "x": 940, "y": 80},
                        {"text": "Launch", "x": 940, "y": 160},
                    ],
                },
            ],
        }
    }


class Mindmap(BaseModel):
    PRIVATE_ACCESS = 1
    PUBLIC_ACCESS = 0
    DEFAULT_SORT_ORDER = 65535

    ACCESS_CHOICES = ((PRIVATE_ACCESS, "Private"), (PUBLIC_ACCESS, "Public"))

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="mindmaps")
    name = models.TextField(blank=True, default="Untitled Mindmap")
    data = models.JSONField(default=get_default_mindmap_data, blank=True)
    owned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mindmaps")
    access = models.PositiveSmallIntegerField(choices=ACCESS_CHOICES, default=0)
    color = models.CharField(max_length=255, blank=True)
    archived_at = models.DateField(null=True)
    is_locked = models.BooleanField(default=False)
    view_props = models.JSONField(default=dict)
    logo_props = models.JSONField(default=dict)
    projects = models.ManyToManyField("db.Project", related_name="mindmaps", through="db.ProjectMindmap")
    sort_order = models.FloatField(default=DEFAULT_SORT_ORDER)

    class Meta:
        verbose_name = "Mindmap"
        verbose_name_plural = "Mindmaps"
        db_table = "mindmaps"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.owned_by.email} <{self.name}>"


class ProjectMindmap(BaseModel):
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="project_mindmaps")
    mindmap = models.ForeignKey("db.Mindmap", on_delete=models.CASCADE, related_name="project_mindmaps")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="project_mindmaps")

    class Meta:
        unique_together = ["project", "mindmap", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "mindmap"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_mindmap_unique_project_mindmap_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Mindmap"
        verbose_name_plural = "Project Mindmaps"
        db_table = "project_mindmaps"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project.name} {self.mindmap.name}"
