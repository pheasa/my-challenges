# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    MindmapViewSet,
    MindmapFavoriteViewSet,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/mindmaps/",
        MindmapViewSet.as_view({"get": "list", "post": "create"}),
        name="project-mindmaps",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/mindmaps/<uuid:mindmap_id>/",
        MindmapViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="project-mindmap-detail",
    ),
    # favorite mindmaps
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/favorite-mindmaps/<uuid:mindmap_id>/",
        MindmapFavoriteViewSet.as_view({"post": "create", "delete": "destroy"}),
        name="user-favorite-mindmaps",
    ),
    # archived mindmaps
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/mindmaps/<uuid:mindmap_id>/archive/",
        MindmapViewSet.as_view({"post": "archive", "delete": "unarchive"}),
        name="project-mindmap-archive-unarchive",
    ),
    # lock and unlock
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/mindmaps/<uuid:mindmap_id>/lock/",
        MindmapViewSet.as_view({"post": "lock", "delete": "unlock"}),
        name="project-mindmaps-lock-unlock",
    ),
    # private and public access
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/mindmaps/<uuid:mindmap_id>/access/",
        MindmapViewSet.as_view({"post": "access"}),
        name="project-mindmaps-access",
    ),
]
