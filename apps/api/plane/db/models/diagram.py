# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models

from .base import BaseModel


def get_default_diagram_data():
    return {
        "code": "classDiagram\nclass User {\n  +int id\n  +string name\n  +string email\n  +login()\n  +logout()\n}\n\nclass Order {\n  +int id\n  +double total\n  +createOrder()\n  +cancelOrder()\n}\n\nUser \"1\" --> \"many\" Order",
        "type": "class",
    }


class Diagram(BaseModel):
    PRIVATE_ACCESS = 1
    PUBLIC_ACCESS = 0
    DEFAULT_SORT_ORDER = 65535

    ACCESS_CHOICES = ((PRIVATE_ACCESS, "Private"), (PUBLIC_ACCESS, "Public"))

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="diagrams")
    name = models.TextField(blank=True, default="Untitled Diagram")
    data = models.JSONField(default=get_default_diagram_data, blank=True)
    owned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="diagrams")
    access = models.PositiveSmallIntegerField(choices=ACCESS_CHOICES, default=0)
    color = models.CharField(max_length=255, blank=True)
    archived_at = models.DateField(null=True)
    is_locked = models.BooleanField(default=False)
    view_props = models.JSONField(default=dict)
    logo_props = models.JSONField(default=dict)
    projects = models.ManyToManyField("db.Project", related_name="diagrams", through="db.ProjectDiagram")
    sort_order = models.FloatField(default=DEFAULT_SORT_ORDER)

    class Meta:
        verbose_name = "Diagram"
        verbose_name_plural = "Diagrams"
        db_table = "diagrams"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.owned_by.email} <{self.name}>"


class ProjectDiagram(BaseModel):
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="project_diagrams")
    diagram = models.ForeignKey("db.Diagram", on_delete=models.CASCADE, related_name="project_diagrams")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="project_diagrams")

    class Meta:
        unique_together = ["project", "diagram", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "diagram"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_diagram_unique_project_diagram_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Diagram"
        verbose_name_plural = "Project Diagrams"
        db_table = "project_diagrams"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project.name} {self.diagram.name}"
