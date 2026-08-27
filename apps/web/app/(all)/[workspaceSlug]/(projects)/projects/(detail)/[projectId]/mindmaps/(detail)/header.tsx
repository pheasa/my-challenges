/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { MindmapIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
import { CommonProjectBreadcrumbs } from "@/components/breadcrumbs/common";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { useMindmap } from "@/hooks/store/use-mindmap";
import { useProject } from "@/hooks/store/use-project";

export const MindmapDetailsHeader = observer(function MindmapDetailsHeader() {
  const { workspaceSlug, projectId, mindmapId } = useParams();
  const { currentProjectDetails, loader } = useProject();
  const { getMindmapById } = useMindmap();

  const mindmap = getMindmapById(mindmapId?.toString() ?? "");

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label="Mindmaps"
                href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/mindmaps/`}
                icon={<MindmapIcon className="h-4 w-4 text-tertiary" />}
              />
            }
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={mindmap?.name || "Mindmap"}
                href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/mindmaps/${mindmapId}`}
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
