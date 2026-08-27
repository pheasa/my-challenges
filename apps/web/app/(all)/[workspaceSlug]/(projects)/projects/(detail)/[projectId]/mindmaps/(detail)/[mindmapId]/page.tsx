/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PageHead } from "@/components/core/page-title";
import { MindmapCanvas } from "@/components/mindmaps/mindmap-canvas";
import { useMindmap } from "@/hooks/store/use-mindmap";
import { useProject } from "@/hooks/store/use-project";
import type { Route } from "./+types/page";

function MindmapDetailPage(props: Route.ComponentProps) {
  const routeParams = useParams();
  const workspaceSlug = (props?.params?.workspaceSlug || routeParams?.workspaceSlug) as string;
  const projectId = (props?.params?.projectId || routeParams?.projectId) as string;
  const mindmapId = (props?.params?.mindmapId || routeParams?.mindmapId) as string;
  const { getProjectById } = useProject();
  const { getMindmapById, fetchMindmapDetails } = useMindmap();

  const project = getProjectById(projectId);
  const mindmap = getMindmapById(mindmapId);

  const { isLoading, error } = useSWR(
    workspaceSlug && projectId && mindmapId ? `MINDMAP_DETAIL_${mindmapId}` : null,
    () => fetchMindmapDetails(workspaceSlug, projectId, mindmapId),
    {
      revalidateOnFocus: false,
    }
  );

  const pageTitle = mindmap?.name
    ? `${project?.name || "Project"} - ${mindmap.name}`
    : "Mindmap";

  if (isLoading && !mindmap) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );
  }

  if (error || !mindmap) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-slate-500">Mindmap could not be loaded or was deleted.</p>
      </div>
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <MindmapCanvas workspaceSlug={workspaceSlug} projectId={projectId} mindmap={mindmap} />
    </>
  );
}

export default observer(MindmapDetailPage);
