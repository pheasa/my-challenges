/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import type { TIssueServiceType } from "@plane/types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { MindmapItem } from "./mindmap-item";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssueMindmapsCollapsibleContent = observer(function IssueMindmapsCollapsibleContent(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType } = props;

  const {
    mindmap: { getMindmapsByIssueId, getMindmapById },
  } = useIssueDetail(issueServiceType);

  const mindmapIds = getMindmapsByIssueId(issueId) || [];

  if (mindmapIds.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {mindmapIds.map((id) => {
        const issueMindmap = getMindmapById(id);
        if (!issueMindmap) return null;
        return (
          <MindmapItem
            key={id}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            issueMindmap={issueMindmap}
            disabled={disabled}
            issueServiceType={issueServiceType}
          />
        );
      })}
    </div>
  );
});
