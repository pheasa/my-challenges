/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { DiagramIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
import { CommonProjectBreadcrumbs } from "@/components/breadcrumbs/common";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { useDiagram } from "@/hooks/store/use-diagram";
import { useProject } from "@/hooks/store/use-project";

export const DiagramDetailsHeader = observer(function DiagramDetailsHeader() {
  const { workspaceSlug, projectId, diagramId } = useParams();
  const { currentProjectDetails, loader } = useProject();
  const { getDiagramById } = useDiagram();

  const diagram = getDiagramById(diagramId?.toString() ?? "");

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label="Diagrams"
                href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/diagrams/`}
                icon={<DiagramIcon className="h-4 w-4 text-tertiary" />}
              />
            }
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={diagram?.name || "Diagram"}
                href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/diagrams/${diagramId}`}
                isLast
              />
            }
            isLast
          />
        </Breadcrumbs>
      </Header.LeftItem>
    </Header>
  );
});
