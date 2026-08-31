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
import { DiagramCanvas } from "@/components/diagrams/diagram-canvas";
import { useDiagram } from "@/hooks/store/use-diagram";
import { useProject } from "@/hooks/store/use-project";
import type { Route } from "./+types/page";

function DiagramDetailPage(props: Route.ComponentProps) {
  const routeParams = useParams();
  const workspaceSlug = (props?.params?.workspaceSlug || routeParams?.workspaceSlug) as string;
  const projectId = (props?.params?.projectId || routeParams?.projectId) as string;
  const diagramId = (props?.params?.diagramId || routeParams?.diagramId) as string;
  const { getProjectById } = useProject();
  const { getDiagramById, fetchDiagramDetails } = useDiagram();

  const project = getProjectById(projectId);
  const diagram = getDiagramById(diagramId);

  const { isLoading, error } = useSWR(
    workspaceSlug && projectId && diagramId ? `DIAGRAM_DETAIL_${diagramId}` : null,
    () => fetchDiagramDetails(workspaceSlug, projectId, diagramId),
    {
      revalidateOnFocus: false,
    }
  );

  const pageTitle = diagram?.name
    ? `${project?.name || "Project"} - ${diagram.name}`
    : "Diagram";

  if (isLoading && !diagram) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );
  }

  if (error || !diagram) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-slate-500">Diagram could not be loaded or was deleted.</p>
      </div>
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <DiagramCanvas workspaceSlug={workspaceSlug} projectId={projectId} diagram={diagram} />
    </>
  );
}

export default observer(DiagramDetailPage);
