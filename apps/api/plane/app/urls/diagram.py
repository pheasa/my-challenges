# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    DiagramViewSet,
    DiagramFavoriteViewSet,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/diagrams/",
        DiagramViewSet.as_view({"get": "list", "post": "create"}),
        name="project-diagrams",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/diagrams/<uuid:diagram_id>/",
        DiagramViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="project-diagram-detail",
    ),
    # favorite diagrams
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/favorite-diagrams/<uuid:diagram_id>/",
        DiagramFavoriteViewSet.as_view({"post": "create", "delete": "destroy"}),
        name="user-favorite-diagrams",
    ),
    # archived diagrams
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/diagrams/<uuid:diagram_id>/archive/",
        DiagramViewSet.as_view({"post": "archive", "delete": "unarchive"}),
        name="project-diagram-archive-unarchive",
    ),
    # lock and unlock
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/diagrams/<uuid:diagram_id>/lock/",
        DiagramViewSet.as_view({"post": "lock", "delete": "unlock"}),
        name="project-diagrams-lock-unlock",
    ),
    # private and public access
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/diagrams/<uuid:diagram_id>/access/",
        DiagramViewSet.as_view({"post": "access"}),
        name="project-diagrams-access",
    ),
]
