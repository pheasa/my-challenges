/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles } from "@plane/types";
import darkPagesAsset from "@/app/assets/empty-state/disabled-feature/pages-dark.webp?url";
import lightPagesAsset from "@/app/assets/empty-state/disabled-feature/pages-light.webp?url";
import { PageHead } from "@/components/core/page-title";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { MindmapList } from "@/components/mindmaps/list/mindmap-list";
import { useMindmap } from "@/hooks/store/use-mindmap";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import type { Route } from "./+types/page";

function ProjectMindmapsPage(props: Route.ComponentProps) {
  const router = useAppRouter();
  const routeParams = useParams();
  const workspaceSlug = (props?.params?.workspaceSlug || routeParams?.workspaceSlug) as string;
  const projectId = (props?.params?.projectId || routeParams?.projectId) as string;
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();

  const { getProjectById, currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();
  const { fetchMindmapsList } = useMindmap();

  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project?.name} - Mindmaps` : "Mindmaps";
  const canPerformEmptyStateActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const resolvedPath = resolvedTheme === "light" ? lightPagesAsset : darkPagesAsset;

  useEffect(() => {
    if (workspaceSlug && projectId) {
      fetchMindmapsList(workspaceSlug, projectId);
    }
  }, [workspaceSlug, projectId, fetchMindmapsList]);

  if (currentProjectDetails?.mindmap_view === false) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <DetailedEmptyState
          title="Mindmaps are disabled"
          description="Enable mindmaps from project settings to create visual tree structures and brainstorm ideas."
          assetPath={resolvedPath}
          primaryButton={{
            text: "Go to Settings",
            onClick: () => {
              router.push(`/${workspaceSlug}/settings/projects/${projectId}/features`);
            },
            disabled: !canPerformEmptyStateActions,
          }}
        />
      </div>
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <MindmapList workspaceSlug={workspaceSlug} projectId={projectId} />
    </>
  );
}

export default observer(ProjectMindmapsPage);
