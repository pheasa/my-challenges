/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import type { TIssueServiceType } from "@plane/types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { DiagramItem } from "./diagram-item";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssueDiagramsCollapsibleContent = observer(function IssueDiagramsCollapsibleContent(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType } = props;

  const {
    diagram: { getDiagramsByIssueId, getDiagramById },
  } = useIssueDetail(issueServiceType);

  const diagramIds = getDiagramsByIssueId(issueId) || [];

  if (diagramIds.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {diagramIds.map((id) => {
        const issueDiagram = getDiagramById(id);
        if (!issueDiagram) return null;
        return (
          <DiagramItem
            key={id}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            issueDiagram={issueDiagram}
            disabled={disabled}
            issueServiceType={issueServiceType}
          />
        );
      })}
    </div>
  );
});
